import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkshopSnapshot } from "../types";
import { DEFAULT_DASHBOARD_LAYOUT } from "../types";
import {
  fromAppointment,
  fromCustomer,
  fromInventoryItem,
  fromInvoice,
  fromInvoiceItem,
  fromLaborLine,
  fromMotorcycle,
  fromPartLine,
  fromQuote,
  fromQuoteItem,
  fromSettings,
  fromUser,
  fromWorkOrder,
  PHOTO_BUCKET,
  toAppointment,
  toCustomer,
  toInventoryItem,
  toInvoice,
  toDocumentLine,
  toLaborLine,
  toMotorcycle,
  toPartLine,
  toQuote,
  toSettings,
  toUser,
  toWorkOrder,
  type AppointmentRow,
  type CustomerRow,
  type InventoryItemRow,
  type InvoiceItemRow,
  type InvoiceRow,
  type MotorcycleRow,
  type OrganizationRow,
  type ProfileRow,
  type QuoteItemRow,
  type QuoteRow,
  type WorkOrderLaborRow,
  type WorkOrderPartRow,
  type WorkOrderRow,
} from "./rows";

type AnyRow = Record<string, unknown> & { id: string };

type TableSpec = {
  table: string;
  /** `update` se usa cuando la tabla no tiene política de INSERT (organizaciones). */
  mode?: "upsert" | "update";
  deletable?: boolean;
  rows: (snapshot: WorkshopSnapshot, supabaseUrl: string) => AnyRow[];
};

/**
 * Orden pensado para respetar las claves foráneas: primero padres, después hijos.
 * Las eliminaciones se ejecutan en orden inverso.
 */
const SPECS: TableSpec[] = [
  {
    table: "organizations",
    mode: "update",
    deletable: false,
    rows: (snapshot) => [fromSettings(snapshot.settings)],
  },
  {
    table: "profiles",
    deletable: false,
    rows: (snapshot) => snapshot.users.map(fromUser),
  },
  {
    table: "customers",
    rows: (snapshot) => snapshot.customers.map(fromCustomer),
  },
  {
    table: "motorcycles",
    rows: (snapshot, supabaseUrl) =>
      snapshot.motorcycles.map((item) => fromMotorcycle(item, supabaseUrl)),
  },
  {
    table: "inventory_items",
    rows: (snapshot) => snapshot.inventory.map(fromInventoryItem),
  },
  {
    table: "work_orders",
    rows: (snapshot) => snapshot.workOrders.map(fromWorkOrder),
  },
  {
    table: "work_order_labor",
    rows: (snapshot) =>
      snapshot.workOrders.flatMap((order) =>
        order.labor.map((line) => fromLaborLine(order.id, line)),
      ),
  },
  {
    table: "work_order_parts",
    rows: (snapshot) =>
      snapshot.workOrders.flatMap((order) =>
        order.parts.map((line) => fromPartLine(order.id, line)),
      ),
  },
  {
    table: "quotes",
    rows: (snapshot) => snapshot.quotes.map(fromQuote),
  },
  {
    table: "quote_items",
    rows: (snapshot) =>
      snapshot.quotes.flatMap((quote) => quote.lines.map((line) => fromQuoteItem(quote.id, line))),
  },
  {
    table: "invoices",
    rows: (snapshot) => snapshot.invoices.map(fromInvoice),
  },
  {
    table: "invoice_items",
    rows: (snapshot) =>
      snapshot.invoices.flatMap((invoice) =>
        invoice.lines.map((line) => fromInvoiceItem(invoice.id, line)),
      ),
  },
  {
    table: "appointments",
    rows: (snapshot) => snapshot.appointments.map(fromAppointment),
  },
];

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "error desconocido"}`);
}

async function selectAll<T>(client: SupabaseClient, table: string, filters?: Record<string, string>) {
  let query = client.from(table).select("*");
  if (filters) {
    for (const [column, value] of Object.entries(filters)) {
      query = query.eq(column, value);
    }
  }
  const { data, error } = await query;
  if (error) fail(`No se pudieron leer los datos de ${table}`, error);
  return (data ?? []) as T[];
}

/**
 * Carga el taller completo del usuario autenticado. Devuelve `null` cuando no
 * hay sesión o cuando el usuario todavía no pertenece a ningún taller.
 */
export async function fetchSnapshot(
  client: SupabaseClient,
  supabaseUrl: string,
  dashboardLayout: string[] = [...DEFAULT_DASHBOARD_LAYOUT],
): Promise<WorkshopSnapshot | null> {
  const { data: sessionData, error: sessionError } = await client.auth.getUser();
  if (sessionError) return null;
  const authUser = sessionData.user;
  if (!authUser) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();
  if (profileError) fail("No se pudo leer el perfil del usuario", profileError);
  if (!profile) return null;

  const organizationId = (profile as ProfileRow).organization_id;

  const [organizations, profiles, customers, motorcycles, inventory, workOrders, quotes, invoices, appointments] =
    await Promise.all([
      selectAll<OrganizationRow>(client, "organizations", { id: organizationId }),
      selectAll<ProfileRow>(client, "profiles", { organization_id: organizationId }),
      selectAll<CustomerRow>(client, "customers", { organization_id: organizationId }),
      selectAll<MotorcycleRow>(client, "motorcycles", { organization_id: organizationId }),
      selectAll<InventoryItemRow>(client, "inventory_items", { organization_id: organizationId }),
      selectAll<WorkOrderRow>(client, "work_orders", { organization_id: organizationId }),
      selectAll<QuoteRow>(client, "quotes", { organization_id: organizationId }),
      selectAll<InvoiceRow>(client, "invoices", { organization_id: organizationId }),
      selectAll<AppointmentRow>(client, "appointments", { organization_id: organizationId }),
    ]);

  const organizationRow = organizations[0];
  if (!organizationRow) return null;

  const [labor, parts, quoteItems, invoiceItems] = await Promise.all([
    selectAll<WorkOrderLaborRow>(client, "work_order_labor"),
    selectAll<WorkOrderPartRow>(client, "work_order_parts"),
    selectAll<QuoteItemRow>(client, "quote_items"),
    selectAll<InvoiceItemRow>(client, "invoice_items"),
  ]);

  const users = profiles.map(toUser);

  return {
    currentUserId: (profile as ProfileRow).active ? authUser.id : null,
    dashboardLayout,
    settings: toSettings(organizationRow),
    users,
    customers: customers.map(toCustomer),
    motorcycles: motorcycles.map((row) => toMotorcycle(row, supabaseUrl)),
    inventory: inventory.map(toInventoryItem),
    workOrders: workOrders.map((row) => ({
      ...toWorkOrder(row),
      labor: labor.filter((line) => line.work_order_id === row.id).map(toLaborLine),
      parts: parts.filter((line) => line.work_order_id === row.id).map(toPartLine),
    })),
    quotes: quotes.map((row) => ({
      ...toQuote(row),
      lines: quoteItems.filter((line) => line.quote_id === row.id).map(toDocumentLine),
    })),
    invoices: invoices.map((row) => ({
      ...toInvoice(row),
      lines: invoiceItems.filter((line) => line.invoice_id === row.id).map(toDocumentLine),
    })),
    appointments: appointments.map(toAppointment),
  };
}

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function uploadMotorcyclePhoto(
  client: SupabaseClient,
  organizationId: string,
  motorcycleId: string,
  dataUrl: string,
): Promise<string | null> {
  const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!match) return null;
  const [, mime, base64] = match;
  const path = `${organizationId}/${motorcycleId}`;
  const { error } = await client.storage
    .from(PHOTO_BUCKET)
    .upload(path, decodeBase64(base64), { contentType: mime, upsert: true });
  if (error) {
    throw new Error(
      `No se pudo subir la foto de la moto: ${error.message}. Revisa las políticas del bucket ${PHOTO_BUCKET}.`,
    );
  }
  return client.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Guarda en Supabase solo las filas que cambiaron entre dos versiones del taller.
 * Es una sincronización por diferencias: la interfaz se actualiza al instante en
 * el cliente y la escritura remota ocurre después.
 *
 * Devuelve el estado realmente persistido (por ejemplo, con las fotos ya
 * convertidas en URL públicas) para que el cliente no vuelva a subirlas.
 */
export async function syncSnapshot(
  client: SupabaseClient,
  supabaseUrl: string,
  previous: WorkshopSnapshot,
  next: WorkshopSnapshot,
): Promise<WorkshopSnapshot> {
  let working = next;

  const photoDataUrls = next.motorcycles.filter((item) => item.photoDataUrl.startsWith("data:"));
  if (photoDataUrls.length > 0) {
    const resolved = new Map<string, string>();
    for (const motorcycle of photoDataUrls) {
      const url = await uploadMotorcyclePhoto(
        client,
        next.settings.id,
        motorcycle.id,
        motorcycle.photoDataUrl,
      );
      if (url) resolved.set(motorcycle.id, url);
    }
    if (resolved.size > 0) {
      working = {
        ...next,
        motorcycles: next.motorcycles.map((item) =>
          resolved.has(item.id) ? { ...item, photoDataUrl: resolved.get(item.id) as string } : item,
        ),
      };
    }
  }

  const before = new Map<string, Map<string, AnyRow>>();
  const after = new Map<string, AnyRow[]>();
  for (const spec of SPECS) {
    before.set(
      spec.table,
      new Map(spec.rows(previous, supabaseUrl).map((row) => [row.id, row])),
    );
    after.set(spec.table, spec.rows(working, supabaseUrl));
  }

  for (const spec of [...SPECS].reverse()) {
    if (spec.deletable === false) continue;
    const previousRows = before.get(spec.table) ?? new Map();
    const nextIds = new Set((after.get(spec.table) ?? []).map((row) => row.id));
    const removed = [...previousRows.keys()].filter((id) => !nextIds.has(id));
    if (removed.length === 0) continue;
    const { error } = await client.from(spec.table).delete().in("id", removed);
    if (error) fail(`No se pudieron eliminar registros de ${spec.table}`, error);
  }

  for (const spec of SPECS) {
    const previousRows = before.get(spec.table) ?? new Map<string, AnyRow>();
    const nextRows = after.get(spec.table) ?? [];
    const changed = nextRows.filter((row) => {
      const old = previousRows.get(row.id);
      return !old || JSON.stringify(old) !== JSON.stringify(row);
    });
    if (changed.length === 0) continue;

    if (spec.mode === "update") {
      for (const row of changed) {
        const { id, ...values } = row;
        const { error } = await client.from(spec.table).update(values).eq("id", id);
        if (error) fail(`No se pudo actualizar ${spec.table}`, error);
      }
    } else {
      const { error } = await client.from(spec.table).upsert(changed);
      if (error) fail(`No se pudo guardar en ${spec.table}`, error);
    }
  }

  return working;
}
