import type { Role } from "./types";

export type Permission =
  | "dashboard"
  | "customers"
  | "motorcycles"
  | "work_orders"
  | "inventory_read"
  | "inventory_write"
  | "quotes"
  | "invoices"
  | "appointments"
  | "users"
  | "settings"
  | "reports";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "dashboard",
    "customers",
    "motorcycles",
    "work_orders",
    "inventory_read",
    "inventory_write",
    "quotes",
    "invoices",
    "appointments",
    "users",
    "settings",
    "reports",
  ],
  mechanic: [
    "dashboard",
    "customers",
    "motorcycles",
    "work_orders",
    "inventory_read",
    "appointments",
  ],
  cashier: [
    "dashboard",
    "customers",
    "motorcycles",
    "inventory_read",
    "quotes",
    "invoices",
    "appointments",
    "reports",
  ],
};

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  mechanic: "Mecánico",
  cashier: "Cajero / Recepcionista",
};

export const STATUS_LABEL: Record<string, string> = {
  recibido: "Recibido",
  en_revision: "En revisión",
  en_reparacion: "En reparación",
  listo: "Listo",
  entregado: "Entregado",
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  convertida: "Convertida",
  rechazada: "Rechazada",
  pendiente: "Pendiente",
  pagada: "Pagada",
  anulada: "Anulada",
  programada: "Programada",
  completada: "Completada",
  cancelada: "Cancelada",
};
