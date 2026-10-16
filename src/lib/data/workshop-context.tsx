"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { can, type Permission } from "../permissions";
import { createSupabaseBrowserClient } from "../supabase/client";
import { getSupabasePublicConfig, isSupabaseConfigured } from "../supabase/env";
import { fetchSnapshot, syncSnapshot } from "../supabase/repository";
import type { AppUser, WorkshopSettings, WorkshopSnapshot } from "../types";
import {
  convertQuoteToInvoice,
  deleteCustomer,
  deleteInventory,
  deleteMotorcycle,
  DomainError,
  invoiceFromWorkOrder,
  loginSnapshot,
  logoutSnapshot,
  markReminderSent,
  registerWorkshop,
  setDashboardLayout,
  setInvoiceStatus,
  signWorkOrder,
  updateSettings,
  upsertAppointment,
  upsertCustomer,
  upsertInventory,
  upsertMotorcycle,
  upsertQuote,
  upsertUser,
  upsertWorkOrder,
} from "./mutations";
import { loadLayout, loadSnapshot, resetSnapshot, saveLayout, saveSnapshot } from "./storage";

type Toast = { id: number; kind: "ok" | "error"; message: string };

export type RegisterInput = {
  workshopName: string;
  fullName: string;
  email: string;
  password: string;
};

type WorkshopContextValue = {
  ready: boolean;
  snapshot: WorkshopSnapshot;
  user: AppUser | null;
  demoMode: boolean;
  toast: Toast | null;
  notify: (kind: Toast["kind"], message: string) => void;
  allowed: (permission: Permission) => boolean;
  run: (mutator: (state: WorkshopSnapshot) => WorkshopSnapshot) => boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  resetDemo: () => Promise<void>;
  register: (input: RegisterInput) => Promise<boolean>;
};

const WorkshopContext = createContext<WorkshopContextValue | null>(null);

const EMPTY_SETTINGS: WorkshopSettings = {
  id: "",
  name: "",
  taxId: "",
  address: "",
  phone: "",
  email: "",
  ivaRate: 19,
  currency: "COP",
  invoicePrefix: "FAC",
  quotePrefix: "COT",
  workOrderPrefix: "OT",
  nextInvoiceNumber: 1,
  nextQuoteNumber: 1,
  nextWorkOrderNumber: 1,
};

/** Taller vacío: se usa mientras no hay sesión o mientras se carga la remota. */
function emptySnapshot(dashboardLayout: string[]): WorkshopSnapshot {
  return {
    currentUserId: null,
    dashboardLayout,
    settings: { ...EMPTY_SETTINGS },
    users: [],
    customers: [],
    motorcycles: [],
    inventory: [],
    workOrders: [],
    quotes: [],
    invoices: [],
    appointments: [],
  };
}

export function WorkshopProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [snapshot, setSnapshot] = useState<WorkshopSnapshot | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!configured) return;
    // El cliente de navegador solo puede crearse tras el montaje.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cliente perezoso del navegador
    setSupabase(createSupabaseBrowserClient());
  }, [configured]);

  const notify = useCallback((kind: Toast["kind"], message: string) => {
    setToast({ id: Date.now(), kind, message });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  // Modo demostración: el taller vive en localStorage de este navegador.
  useEffect(() => {
    if (configured) return;
    // Persistencia local: hidrata después del montaje para coincidir con el HTML del servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrap from localStorage
    setSnapshot(loadSnapshot());
  }, [configured]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { url } = getSupabasePublicConfig();
    try {
      const remote = await fetchSnapshot(supabase, url, loadLayout());
      setSnapshot(remote ?? emptySnapshot(loadLayout()));
    } catch (error) {
      notify(
        "error",
        error instanceof Error ? error.message : "No se pudo leer el taller desde Supabase",
      );
      setSnapshot(emptySnapshot(loadLayout()));
    }
  }, [notify, supabase]);

  // Sesión de Supabase: carga el taller al iniciar sesión y lo limpia al salir.
  useEffect(() => {
    if (!supabase) return;
    let active = true;

    void supabase.auth.getSession().then(() => {
      if (active) void refresh();
    });

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        setSnapshot(emptySnapshot(loadLayout()));
        return;
      }
      // Se difiere para no bloquear el callback interno de Supabase Auth.
      window.setTimeout(() => {
        if (active) void refresh();
      }, 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [refresh, supabase]);

  useEffect(() => {
    if (!snapshot) return;
    if (configured) saveLayout(snapshot.dashboardLayout);
    else saveSnapshot(snapshot);
  }, [configured, snapshot]);

  const notifyError = useCallback(
    (error: unknown) => {
      notify(
        "error",
        error instanceof DomainError || error instanceof Error
          ? error.message
          : "No se pudo completar la operación",
      );
    },
    [notify],
  );

  const run = useCallback(
    (mutator: (state: WorkshopSnapshot) => WorkshopSnapshot) => {
      if (!snapshot) return false;

      let next: WorkshopSnapshot;
      try {
        next = mutator(snapshot);
      } catch (error) {
        notifyError(error);
        return false;
      }

      // Optimista: la interfaz cambia de inmediato.
      setSnapshot(next);

      // Con Supabase configurado la escritura remota ocurre por diferencias.
      if (supabase) {
        const { url } = getSupabasePublicConfig();
        void syncSnapshot(supabase, url, snapshot, next)
          .then((persisted) => {
            setSnapshot((current) => (current === next ? persisted : current));
          })
          .catch(notifyError);
      }

      return true;
    },
    [notifyError, snapshot, supabase],
  );

  const user = snapshot?.users.find((item) => item.id === snapshot.currentUserId) ?? null;

  const value = useMemo<WorkshopContextValue | null>(() => {
    if (!snapshot) return null;
    return {
      ready: true,
      snapshot,
      user,
      demoMode: !configured,
      toast,
      notify,
      allowed: (permission) => can(user?.role, permission),
      run,
      refresh,
      login: async (email, password) => {
        if (!supabase) {
          const ok = run((state) => loginSnapshot(state, email, password));
          if (ok) notify("ok", "Sesión iniciada");
          return ok;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          notify("error", `No se pudo iniciar sesión: ${error.message}`);
          return false;
        }
        await refresh();
        notify("ok", "Sesión iniciada");
        return true;
      },
      logout: () => {
        if (!supabase) {
          run(logoutSnapshot);
          return;
        }
        void supabase.auth.signOut();
      },
      resetDemo: async () => {
        if (!supabase) {
          setSnapshot(resetSnapshot());
          notify("ok", "Datos de demostración restaurados");
          return;
        }
        await refresh();
        notify("ok", "Taller recargado desde Supabase");
      },
      register: async (input) => {
        if (!supabase) {
          const ok = run((state) => registerWorkshop(state, input));
          if (ok) notify("ok", "Taller creado");
          return ok;
        }
        const { data, error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
        });
        if (error) {
          notify("error", `No se pudo crear la cuenta: ${error.message}`);
          return false;
        }
        if (!data.session) {
          notify("ok", "Cuenta creada. Confirma tu correo y luego inicia sesión.");
          return true;
        }
        const { error: rpcError } = await supabase.rpc("register_workshop", {
          workshop_name: input.workshopName,
          full_name: input.fullName,
        });
        if (rpcError) {
          notify("error", `No se pudo registrar el taller: ${rpcError.message}`);
          return false;
        }
        await refresh();
        notify("ok", "Taller creado");
        return true;
      },
    };
  }, [configured, notify, refresh, run, snapshot, supabase, toast, user]);

  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] text-[#00d4aa]">
        Cargando taller…
      </div>
    );
  }

  return <WorkshopContext.Provider value={value}>{children}</WorkshopContext.Provider>;
}

export function useWorkshop() {
  const context = useContext(WorkshopContext);
  if (!context) throw new Error("useWorkshop debe usarse dentro de WorkshopProvider");
  return context;
}

export {
  convertQuoteToInvoice,
  deleteCustomer,
  deleteInventory,
  deleteMotorcycle,
  invoiceFromWorkOrder,
  markReminderSent,
  setDashboardLayout,
  setInvoiceStatus,
  signWorkOrder,
  updateSettings,
  upsertAppointment,
  upsertCustomer,
  upsertInventory,
  upsertMotorcycle,
  upsertQuote,
  upsertUser,
  upsertWorkOrder,
};
