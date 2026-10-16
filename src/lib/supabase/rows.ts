import type {
  Appointment,
  AppUser,
  Customer,
  DocumentLine,
  InventoryItem,
  Invoice,
  Motorcycle,
  PartLine,
  Quote,
  Role,
  WorkOrder,
  WorkshopSettings,
} from "../types";

/**
 * Tipos de fila tal como los devuelve PostgREST (snake_case) y funciones puras
 * para convertir entre esas filas y los tipos del dominio. Mantener estas
 * conversiones puras permite probarlas sin conexión a Supabase.
 */

export type OrganizationRow = {
  id: string;
  name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  iva_rate: number | string;
  currency: string;
  invoice_prefix: string;
  quote_prefix: string;
  work_order_prefix: string;
  next_invoice_number: number;
  next_quote_number: number;
  next_work_order_number: number;
};

export type ProfileRow = {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: Role;
  active: boolean;
  created_at: string;
};

export type CustomerRow = {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string;
  document_id: string;
  address: string;
  notes: string;
  created_at: string;
};

export type MotorcycleRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  vin: string;
  mileage: number;
  photo_path: string;
  notes: string;
  created_at: string;
};

export type InventoryItemRow = {
  id: string;
  organization_id: string;
  code: string;
  description: string;
  category: string;
  purchase_price: number | string;
  sale_price: number | string;
  stock: number | string;
  min_stock: number | string;
};

export type WorkOrderRow = {
  id: string;
  organization_id: string;
  number: string;
  customer_id: string;
  motorcycle_id: string;
  assigned_user_id: string | null;
  status: WorkOrder["status"];
  diagnosis: string;
  notes: string;
  mileage_in: number;
  signature_data: string;
  received_at: string;
  delivered_at: string | null;
  created_at: string;
};

export type WorkOrderLaborRow = {
  id: string;
  work_order_id: string;
  description: string;
  hours: number | string;
  rate: number | string;
};

export type WorkOrderPartRow = {
  id: string;
  work_order_id: string;
  inventory_item_id: string | null;
  description: string;
  quantity: number | string;
  unit_price: number | string;
};

export type QuoteRow = {
  id: string;
  organization_id: string;
  number: string;
  customer_id: string;
  motorcycle_id: string | null;
  status: Quote["status"];
  notes: string;
  valid_until: string | null;
  iva_rate: number | string;
  converted_invoice_id: string | null;
  created_at: string;
};

export type QuoteItemRow = {
  id: string;
  quote_id: string;
  kind: DocumentLine["kind"];
  description: string;
  quantity: number | string;
  unit_price: number | string;
};

export type InvoiceRow = {
  id: string;
  organization_id: string;
  number: string;
  quote_id: string | null;
  work_order_id: string | null;
  customer_id: string;
  status: Invoice["status"];
  notes: string;
  iva_rate: number | string;
  issued_at: string;
  paid_at: string | null;
};

export type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  kind: DocumentLine["kind"];
  description: string;
  quantity: number | string;
  unit_price: number | string;
};

export type AppointmentRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  motorcycle_id: string | null;
  starts_at: string;
  ends_at: string;
  service_type: string;
  notes: string;
  status: Appointment["status"];
  reminder_sent_at: string | null;
};

export const PHOTO_BUCKET = "motorcycle-photos";

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: string | null | undefined): string {
  return value ?? "";
}

function optional(value: string | null | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

/** Convierte la ruta guardada en Storage a una URL pública mostrable. */
export function photoPathToUrl(path: string, supabaseUrl: string): string {
  if (!path) return "";
  if (path.startsWith("data:") || path.startsWith("http")) return path;
  return `${supabaseUrl}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

/** Convierte una URL pública del bucket de vuelta a la ruta relativa guardada. */
export function photoUrlToPath(url: string, supabaseUrl: string): string {
  if (!url) return "";
  const prefix = `${supabaseUrl}/storage/v1/object/public/${PHOTO_BUCKET}/`;
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  if (url.startsWith("data:")) return url;
  return url;
}

// --- organizaciones ---------------------------------------------------------

export function toSettings(row: OrganizationRow): WorkshopSettings {
  return {
    id: row.id,
    name: row.name,
    taxId: row.tax_id,
    address: row.address,
    phone: row.phone,
    email: row.email,
    ivaRate: num(row.iva_rate),
    currency: row.currency,
    invoicePrefix: row.invoice_prefix,
    quotePrefix: row.quote_prefix,
    workOrderPrefix: row.work_order_prefix,
    nextInvoiceNumber: row.next_invoice_number,
    nextQuoteNumber: row.next_quote_number,
    nextWorkOrderNumber: row.next_work_order_number,
  };
}

export function fromSettings(settings: WorkshopSettings): OrganizationRow {
  return {
    id: settings.id,
    name: settings.name,
    tax_id: settings.taxId,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    iva_rate: settings.ivaRate,
    currency: settings.currency,
    invoice_prefix: settings.invoicePrefix,
    quote_prefix: settings.quotePrefix,
    work_order_prefix: settings.workOrderPrefix,
    next_invoice_number: settings.nextInvoiceNumber,
    next_quote_number: settings.nextQuoteNumber,
    next_work_order_number: settings.nextWorkOrderNumber,
  };
}

// --- perfiles ---------------------------------------------------------------

export function toUser(row: ProfileRow): AppUser {
  return {
    id: row.id,
    organizationId: row.organization_id,
    fullName: row.full_name,
    email: row.email,
    password: "",
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function fromUser(user: AppUser): ProfileRow {
  return {
    id: user.id,
    organization_id: user.organizationId,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    active: user.active,
    created_at: user.createdAt,
  };
}

// --- clientes ---------------------------------------------------------------

export function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    documentId: row.document_id,
    address: row.address,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function fromCustomer(customer: Customer): CustomerRow {
  return {
    id: customer.id,
    organization_id: customer.organizationId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    document_id: customer.documentId,
    address: customer.address,
    notes: customer.notes,
    created_at: customer.createdAt,
  };
}

// --- motocicletas -----------------------------------------------------------

export function toMotorcycle(row: MotorcycleRow, supabaseUrl: string): Motorcycle {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    plate: row.plate,
    vin: row.vin,
    mileage: row.mileage,
    photoDataUrl: photoPathToUrl(row.photo_path, supabaseUrl),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function fromMotorcycle(motorcycle: Motorcycle, supabaseUrl: string): MotorcycleRow {
  return {
    id: motorcycle.id,
    organization_id: motorcycle.organizationId,
    customer_id: motorcycle.customerId,
    brand: motorcycle.brand,
    model: motorcycle.model,
    year: motorcycle.year,
    plate: motorcycle.plate,
    vin: motorcycle.vin,
    mileage: motorcycle.mileage,
    photo_path: photoUrlToPath(motorcycle.photoDataUrl, supabaseUrl),
    notes: motorcycle.notes,
    created_at: motorcycle.createdAt,
  };
}

// --- inventario -------------------------------------------------------------

export function toInventoryItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    description: row.description,
    category: row.category,
    purchasePrice: num(row.purchase_price),
    salePrice: num(row.sale_price),
    stock: num(row.stock),
    minStock: num(row.min_stock),
  };
}

export function fromInventoryItem(item: InventoryItem): InventoryItemRow {
  return {
    id: item.id,
    organization_id: item.organizationId,
    code: item.code,
    description: item.description,
    category: item.category,
    purchase_price: item.purchasePrice,
    sale_price: item.salePrice,
    stock: item.stock,
    min_stock: item.minStock,
  };
}

// --- órdenes de trabajo -----------------------------------------------------

export function toWorkOrder(row: WorkOrderRow): Omit<WorkOrder, "labor" | "parts"> {
  return {
    id: row.id,
    organizationId: row.organization_id,
    number: row.number,
    customerId: row.customer_id,
    motorcycleId: row.motorcycle_id,
    assignedUserId: text(row.assigned_user_id),
    status: row.status,
    diagnosis: row.diagnosis,
    notes: row.notes,
    mileageIn: row.mileage_in,
    signatureDataUrl: row.signature_data,
    receivedAt: row.received_at,
    deliveredAt: text(row.delivered_at),
    createdAt: row.created_at,
  };
}

export function fromWorkOrder(order: WorkOrder): WorkOrderRow {
  return {
    id: order.id,
    organization_id: order.organizationId,
    number: order.number,
    customer_id: order.customerId,
    motorcycle_id: order.motorcycleId,
    assigned_user_id: optional(order.assignedUserId),
    status: order.status,
    diagnosis: order.diagnosis,
    notes: order.notes,
    mileage_in: order.mileageIn,
    signature_data: order.signatureDataUrl,
    received_at: order.receivedAt,
    delivered_at: optional(order.deliveredAt),
    created_at: order.createdAt,
  };
}

export function toLaborLine(row: WorkOrderLaborRow): WorkOrder["labor"][number] {
  return {
    id: row.id,
    description: row.description,
    hours: num(row.hours),
    rate: num(row.rate),
  };
}

export function fromLaborLine(orderId: string, line: WorkOrder["labor"][number]): WorkOrderLaborRow {
  return {
    id: line.id,
    work_order_id: orderId,
    description: line.description,
    hours: line.hours,
    rate: line.rate,
  };
}

export function toPartLine(row: WorkOrderPartRow): PartLine {
  return {
    id: row.id,
    itemId: text(row.inventory_item_id),
    description: row.description,
    quantity: num(row.quantity),
    unitPrice: num(row.unit_price),
  };
}

export function fromPartLine(orderId: string, line: PartLine): WorkOrderPartRow {
  return {
    id: line.id,
    work_order_id: orderId,
    inventory_item_id: optional(line.itemId),
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unitPrice,
  };
}

// --- cotizaciones -----------------------------------------------------------

export function toQuote(row: QuoteRow): Omit<Quote, "lines"> {
  return {
    id: row.id,
    organizationId: row.organization_id,
    number: row.number,
    customerId: row.customer_id,
    motorcycleId: text(row.motorcycle_id),
    status: row.status,
    notes: row.notes,
    validUntil: text(row.valid_until),
    ivaRate: num(row.iva_rate),
    createdAt: row.created_at,
    convertedInvoiceId: text(row.converted_invoice_id),
  };
}

export function fromQuote(quote: Quote): QuoteRow {
  return {
    id: quote.id,
    organization_id: quote.organizationId,
    number: quote.number,
    customer_id: quote.customerId,
    motorcycle_id: optional(quote.motorcycleId),
    status: quote.status,
    notes: quote.notes,
    valid_until: optional(quote.validUntil),
    iva_rate: quote.ivaRate,
    converted_invoice_id: optional(quote.convertedInvoiceId),
    created_at: quote.createdAt,
  };
}

export function toDocumentLine(row: QuoteItemRow | InvoiceItemRow): DocumentLine {
  return {
    id: row.id,
    kind: row.kind,
    description: row.description,
    quantity: num(row.quantity),
    unitPrice: num(row.unit_price),
  };
}

export function fromQuoteItem(quoteId: string, line: DocumentLine): QuoteItemRow {
  return {
    id: line.id,
    quote_id: quoteId,
    kind: line.kind,
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unitPrice,
  };
}

// --- facturas ---------------------------------------------------------------

export function toInvoice(row: InvoiceRow): Omit<Invoice, "lines"> {
  return {
    id: row.id,
    organizationId: row.organization_id,
    number: row.number,
    quoteId: text(row.quote_id),
    workOrderId: text(row.work_order_id),
    customerId: row.customer_id,
    status: row.status,
    notes: row.notes,
    ivaRate: num(row.iva_rate),
    issuedAt: row.issued_at,
    paidAt: text(row.paid_at),
  };
}

export function fromInvoice(invoice: Invoice): InvoiceRow {
  return {
    id: invoice.id,
    organization_id: invoice.organizationId,
    number: invoice.number,
    quote_id: optional(invoice.quoteId),
    work_order_id: optional(invoice.workOrderId),
    customer_id: invoice.customerId,
    status: invoice.status,
    notes: invoice.notes,
    iva_rate: invoice.ivaRate,
    issued_at: invoice.issuedAt,
    paid_at: optional(invoice.paidAt),
  };
}

export function fromInvoiceItem(invoiceId: string, line: DocumentLine): InvoiceItemRow {
  return {
    id: line.id,
    invoice_id: invoiceId,
    kind: line.kind,
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unitPrice,
  };
}

// --- agenda -----------------------------------------------------------------

export function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    motorcycleId: text(row.motorcycle_id),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    serviceType: row.service_type,
    notes: row.notes,
    status: row.status,
    reminderSentAt: text(row.reminder_sent_at),
  };
}

export function fromAppointment(appointment: Appointment): AppointmentRow {
  return {
    id: appointment.id,
    organization_id: appointment.organizationId,
    customer_id: appointment.customerId,
    motorcycle_id: optional(appointment.motorcycleId),
    starts_at: appointment.startsAt,
    ends_at: appointment.endsAt,
    service_type: appointment.serviceType,
    notes: appointment.notes,
    status: appointment.status,
    reminder_sent_at: optional(appointment.reminderSentAt),
  };
}
