export type Role = "admin" | "mechanic" | "cashier";

export type WorkOrderStatus =
  | "recibido"
  | "en_revision"
  | "en_reparacion"
  | "listo"
  | "entregado";

export type QuoteStatus = "borrador" | "enviada" | "aceptada" | "convertida" | "rechazada";
export type InvoiceStatus = "pendiente" | "pagada" | "anulada";
export type AppointmentStatus = "programada" | "completada" | "cancelada";
export type LineKind = "labor" | "part";

export type WorkshopSettings = {
  id: string;
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  ivaRate: number;
  currency: string;
  invoicePrefix: string;
  quotePrefix: string;
  workOrderPrefix: string;
  nextInvoiceNumber: number;
  nextQuoteNumber: number;
  nextWorkOrderNumber: number;
};

export type AppUser = {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
  createdAt: string;
};

export type Customer = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  documentId: string;
  address: string;
  notes: string;
  createdAt: string;
};

export type Motorcycle = {
  id: string;
  organizationId: string;
  customerId: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  vin: string;
  mileage: number;
  photoDataUrl: string;
  notes: string;
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  organizationId: string;
  code: string;
  description: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
};

export type LaborLine = {
  id: string;
  description: string;
  hours: number;
  rate: number;
};

export type PartLine = {
  id: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type WorkOrder = {
  id: string;
  organizationId: string;
  number: string;
  customerId: string;
  motorcycleId: string;
  assignedUserId: string;
  status: WorkOrderStatus;
  diagnosis: string;
  notes: string;
  mileageIn: number;
  labor: LaborLine[];
  parts: PartLine[];
  signatureDataUrl: string;
  receivedAt: string;
  deliveredAt: string;
  createdAt: string;
};

export type DocumentLine = {
  id: string;
  kind: LineKind;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type Quote = {
  id: string;
  organizationId: string;
  number: string;
  customerId: string;
  motorcycleId: string;
  status: QuoteStatus;
  notes: string;
  validUntil: string;
  ivaRate: number;
  lines: DocumentLine[];
  createdAt: string;
  convertedInvoiceId: string;
};

export type Invoice = {
  id: string;
  organizationId: string;
  number: string;
  quoteId: string;
  workOrderId: string;
  customerId: string;
  status: InvoiceStatus;
  notes: string;
  ivaRate: number;
  lines: DocumentLine[];
  issuedAt: string;
  paidAt: string;
};

export type Appointment = {
  id: string;
  organizationId: string;
  customerId: string;
  motorcycleId: string;
  startsAt: string;
  endsAt: string;
  serviceType: string;
  notes: string;
  status: AppointmentStatus;
  reminderSentAt: string;
};

export type WorkshopSnapshot = {
  settings: WorkshopSettings;
  users: AppUser[];
  customers: Customer[];
  motorcycles: Motorcycle[];
  inventory: InventoryItem[];
  workOrders: WorkOrder[];
  quotes: Quote[];
  invoices: Invoice[];
  appointments: Appointment[];
  dashboardLayout: string[];
  currentUserId: string | null;
};

export const DEFAULT_DASHBOARD_LAYOUT = [
  "sales",
  "orders",
  "stock",
  "profit",
  "topParts",
  "frequentCustomers",
  "agenda",
  "chart",
] as const;
