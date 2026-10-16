import { documentTotals, laborTotal, lineTotal, padNumber } from "../format";
import { createId } from "../id";
import type {
  Appointment,
  AppUser,
  Customer,
  DocumentLine,
  InventoryItem,
  Invoice,
  Motorcycle,
  Quote,
  Role,
  WorkOrder,
  WorkshopSettings,
  WorkshopSnapshot,
} from "../types";

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

function requireOrg<T extends { id: string; organizationId: string }>(
  items: T[],
  id: string,
  label: string,
): T {
  const found = items.find((item) => item.id === id);
  if (!found) throw new DomainError(`${label} no encontrado`);
  return found;
}

export function loginSnapshot(
  state: WorkshopSnapshot,
  email: string,
  password: string,
): WorkshopSnapshot {
  const user = state.users.find(
    (item) =>
      item.email.toLowerCase() === email.trim().toLowerCase() &&
      item.password === password &&
      item.active,
  );
  if (!user) throw new DomainError("Correo o contraseña incorrectos");
  return { ...state, currentUserId: user.id };
}

export function logoutSnapshot(state: WorkshopSnapshot): WorkshopSnapshot {
  return { ...state, currentUserId: null };
}

export function upsertCustomer(
  state: WorkshopSnapshot,
  input: Omit<Customer, "id" | "organizationId" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
): WorkshopSnapshot {
  const now = new Date().toISOString();
  if (!input.name.trim()) throw new DomainError("El nombre del cliente es obligatorio");
  if (input.id) {
    return {
      ...state,
      customers: state.customers.map((item) =>
        item.id === input.id
          ? {
              ...item,
              name: input.name.trim(),
              email: input.email.trim(),
              phone: input.phone.trim(),
              documentId: input.documentId.trim(),
              address: input.address.trim(),
              notes: input.notes.trim(),
            }
          : item,
      ),
    };
  }
  const customer: Customer = {
    id: createId(),
    organizationId: state.settings.id,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    documentId: input.documentId.trim(),
    address: input.address.trim(),
    notes: input.notes.trim(),
    createdAt: now,
  };
  return { ...state, customers: [customer, ...state.customers] };
}

export function deleteCustomer(state: WorkshopSnapshot, id: string): WorkshopSnapshot {
  if (state.motorcycles.some((item) => item.customerId === id)) {
    throw new DomainError("No se puede eliminar: el cliente tiene motocicletas registradas");
  }
  if (state.workOrders.some((item) => item.customerId === id)) {
    throw new DomainError("No se puede eliminar: el cliente tiene órdenes de trabajo");
  }
  return { ...state, customers: state.customers.filter((item) => item.id !== id) };
}

export function upsertMotorcycle(
  state: WorkshopSnapshot,
  input: Omit<Motorcycle, "id" | "organizationId" | "createdAt"> & { id?: string },
): WorkshopSnapshot {
  requireOrg(state.customers, input.customerId, "Cliente");
  if (!input.brand.trim() || !input.model.trim() || !input.plate.trim()) {
    throw new DomainError("Marca, modelo y placa son obligatorios");
  }
  if (input.vin && input.vin.replace(/\s/g, "").length > 0 && input.vin.length !== 17) {
    throw new DomainError("El VIN debe tener 17 caracteres o dejarse vacío");
  }
  const plate = input.plate.trim().toUpperCase();
  const duplicate = state.motorcycles.find(
    (item) => item.plate === plate && item.id !== input.id,
  );
  if (duplicate) throw new DomainError("Ya existe una motocicleta con esa placa");

  if (input.id) {
    return {
      ...state,
      motorcycles: state.motorcycles.map((item) =>
        item.id === input.id
          ? {
              ...item,
              customerId: input.customerId,
              brand: input.brand.trim(),
              model: input.model.trim(),
              year: input.year,
              plate,
              vin: input.vin.trim().toUpperCase(),
              mileage: input.mileage,
              photoDataUrl: input.photoDataUrl,
              notes: input.notes.trim(),
            }
          : item,
      ),
    };
  }
  const motorcycle: Motorcycle = {
    id: createId(),
    organizationId: state.settings.id,
    customerId: input.customerId,
    brand: input.brand.trim(),
    model: input.model.trim(),
    year: input.year,
    plate,
    vin: input.vin.trim().toUpperCase(),
    mileage: input.mileage,
    photoDataUrl: input.photoDataUrl,
    notes: input.notes.trim(),
    createdAt: new Date().toISOString(),
  };
  return { ...state, motorcycles: [motorcycle, ...state.motorcycles] };
}

export function deleteMotorcycle(state: WorkshopSnapshot, id: string): WorkshopSnapshot {
  if (state.workOrders.some((item) => item.motorcycleId === id)) {
    throw new DomainError("No se puede eliminar: la moto tiene historial de servicio");
  }
  return { ...state, motorcycles: state.motorcycles.filter((item) => item.id !== id) };
}

export function upsertInventory(
  state: WorkshopSnapshot,
  input: Omit<InventoryItem, "id" | "organizationId"> & { id?: string },
): WorkshopSnapshot {
  if (!input.code.trim() || !input.description.trim()) {
    throw new DomainError("Código y descripción son obligatorios");
  }
  const code = input.code.trim().toUpperCase();
  const duplicate = state.inventory.find(
    (item) => item.code === code && item.id !== input.id,
  );
  if (duplicate) throw new DomainError("Ya existe un repuesto con ese código");
  if (input.id) {
    return {
      ...state,
      inventory: state.inventory.map((item) =>
        item.id === input.id
          ? {
              ...item,
              code,
              description: input.description.trim(),
              category: input.category.trim(),
              purchasePrice: input.purchasePrice,
              salePrice: input.salePrice,
              stock: input.stock,
              minStock: input.minStock,
            }
          : item,
      ),
    };
  }
  const item: InventoryItem = {
    id: createId(),
    organizationId: state.settings.id,
    code,
    description: input.description.trim(),
    category: input.category.trim(),
    purchasePrice: input.purchasePrice,
    salePrice: input.salePrice,
    stock: input.stock,
    minStock: input.minStock,
  };
  return { ...state, inventory: [item, ...state.inventory] };
}

export function deleteInventory(state: WorkshopSnapshot, id: string): WorkshopSnapshot {
  return { ...state, inventory: state.inventory.filter((item) => item.id !== id) };
}

function applyStockDelta(
  state: WorkshopSnapshot,
  parts: WorkOrder["parts"],
  direction: 1 | -1,
): InventoryItem[] {
  const next = state.inventory.map((item) => ({ ...item }));
  for (const part of parts) {
    if (!part.itemId) continue;
    const found = next.find((item) => item.id === part.itemId);
    if (!found) continue;
    const stock = found.stock + direction * part.quantity;
    if (stock < 0) {
      throw new DomainError(`Stock insuficiente para ${found.description}`);
    }
    found.stock = stock;
  }
  return next;
}

export function upsertWorkOrder(
  state: WorkshopSnapshot,
  input: Omit<WorkOrder, "id" | "organizationId" | "number" | "createdAt"> & {
    id?: string;
    number?: string;
    createdAt?: string;
  },
  previous?: WorkOrder,
): WorkshopSnapshot {
  requireOrg(state.customers, input.customerId, "Cliente");
  const moto = requireOrg(state.motorcycles, input.motorcycleId, "Motocicleta");
  if (moto.customerId !== input.customerId) {
    throw new DomainError("La motocicleta no pertenece al cliente seleccionado");
  }

  let inventory = state.inventory;
  if (previous) {
    inventory = applyStockDelta({ ...state, inventory }, previous.parts, 1);
  }
  inventory = applyStockDelta({ ...state, inventory }, input.parts, -1);

  if (input.id && previous) {
    return {
      ...state,
      inventory,
      workOrders: state.workOrders.map((item) =>
        item.id === input.id
          ? {
              ...item,
              ...input,
              id: previous.id,
              number: previous.number,
              organizationId: previous.organizationId,
              createdAt: previous.createdAt,
            }
          : item,
      ),
    };
  }

  const number = `${state.settings.workOrderPrefix}-${padNumber(state.settings.nextWorkOrderNumber)}`;
  const order: WorkOrder = {
    id: createId(),
    organizationId: state.settings.id,
    number,
    customerId: input.customerId,
    motorcycleId: input.motorcycleId,
    assignedUserId: input.assignedUserId,
    status: input.status,
    diagnosis: input.diagnosis,
    notes: input.notes,
    mileageIn: input.mileageIn,
    labor: input.labor,
    parts: input.parts,
    signatureDataUrl: input.signatureDataUrl,
    receivedAt: input.receivedAt || new Date().toISOString(),
    deliveredAt: input.status === "entregado" ? input.deliveredAt || new Date().toISOString() : "",
    createdAt: new Date().toISOString(),
  };
  return {
    ...state,
    inventory,
    workOrders: [order, ...state.workOrders],
    motorcycles: state.motorcycles.map((item) =>
      item.id === order.motorcycleId ? { ...item, mileage: Math.max(item.mileage, order.mileageIn) } : item,
    ),
    settings: {
      ...state.settings,
      nextWorkOrderNumber: state.settings.nextWorkOrderNumber + 1,
    },
  };
}

export function signWorkOrder(
  state: WorkshopSnapshot,
  id: string,
  signatureDataUrl: string,
): WorkshopSnapshot {
  if (!signatureDataUrl) throw new DomainError("La firma es obligatoria");
  return {
    ...state,
    workOrders: state.workOrders.map((item) =>
      item.id === id ? { ...item, signatureDataUrl } : item,
    ),
  };
}

export function upsertQuote(
  state: WorkshopSnapshot,
  input: Omit<Quote, "id" | "organizationId" | "number" | "createdAt" | "convertedInvoiceId"> & {
    id?: string;
  },
): WorkshopSnapshot {
  requireOrg(state.customers, input.customerId, "Cliente");
  if (input.motorcycleId) {
    requireOrg(state.motorcycles, input.motorcycleId, "Motocicleta");
  }
  if (!input.lines.length) throw new DomainError("Agrega al menos una línea");
  if (input.id) {
    return {
      ...state,
      quotes: state.quotes.map((item) =>
        item.id === input.id
          ? {
              ...item,
              customerId: input.customerId,
              motorcycleId: input.motorcycleId,
              status: input.status === "convertida" ? item.status : input.status,
              notes: input.notes,
              validUntil: input.validUntil,
              ivaRate: input.ivaRate,
              lines: input.lines,
            }
          : item,
      ),
    };
  }
  const quote: Quote = {
    id: createId(),
    organizationId: state.settings.id,
    number: `${state.settings.quotePrefix}-${padNumber(state.settings.nextQuoteNumber)}`,
    customerId: input.customerId,
    motorcycleId: input.motorcycleId,
    status: input.status,
    notes: input.notes,
    validUntil: input.validUntil,
    ivaRate: input.ivaRate,
    lines: input.lines,
    createdAt: new Date().toISOString(),
    convertedInvoiceId: "",
  };
  return {
    ...state,
    quotes: [quote, ...state.quotes],
    settings: {
      ...state.settings,
      nextQuoteNumber: state.settings.nextQuoteNumber + 1,
    },
  };
}

export function convertQuoteToInvoice(state: WorkshopSnapshot, quoteId: string): WorkshopSnapshot {
  const quote = requireOrg(state.quotes, quoteId, "Cotización");
  if (quote.status === "convertida" || quote.convertedInvoiceId) {
    throw new DomainError("Esta cotización ya fue convertida a factura");
  }
  const invoice: Invoice = {
    id: createId(),
    organizationId: state.settings.id,
    number: `${state.settings.invoicePrefix}-${padNumber(state.settings.nextInvoiceNumber)}`,
    quoteId: quote.id,
    workOrderId: "",
    customerId: quote.customerId,
    status: "pendiente",
    notes: quote.notes,
    ivaRate: quote.ivaRate,
    lines: quote.lines.map((line) => ({ ...line, id: createId() })),
    issuedAt: new Date().toISOString(),
    paidAt: "",
  };
  return {
    ...state,
    invoices: [invoice, ...state.invoices],
    quotes: state.quotes.map((item) =>
      item.id === quote.id
        ? { ...item, status: "convertida", convertedInvoiceId: invoice.id }
        : item,
    ),
    settings: {
      ...state.settings,
      nextInvoiceNumber: state.settings.nextInvoiceNumber + 1,
    },
  };
}

export function invoiceFromWorkOrder(state: WorkshopSnapshot, workOrderId: string): WorkshopSnapshot {
  const order = requireOrg(state.workOrders, workOrderId, "Orden de trabajo");
  if (state.invoices.some((item) => item.workOrderId === workOrderId && item.status !== "anulada")) {
    throw new DomainError("Esta orden ya tiene una factura vigente");
  }
  const lines: DocumentLine[] = [
    ...order.labor.map((line) => ({
      id: createId(),
      kind: "labor" as const,
      description: line.description,
      quantity: line.hours,
      unitPrice: line.rate,
    })),
    ...order.parts.map((line) => ({
      id: createId(),
      kind: "part" as const,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
  ];
  if (!lines.length) throw new DomainError("La orden no tiene mano de obra ni repuestos");
  const invoice: Invoice = {
    id: createId(),
    organizationId: state.settings.id,
    number: `${state.settings.invoicePrefix}-${padNumber(state.settings.nextInvoiceNumber)}`,
    quoteId: "",
    workOrderId,
    customerId: order.customerId,
    status: "pendiente",
    notes: order.notes,
    ivaRate: state.settings.ivaRate,
    lines,
    issuedAt: new Date().toISOString(),
    paidAt: "",
  };
  return {
    ...state,
    invoices: [invoice, ...state.invoices],
    settings: {
      ...state.settings,
      nextInvoiceNumber: state.settings.nextInvoiceNumber + 1,
    },
  };
}

export function setInvoiceStatus(
  state: WorkshopSnapshot,
  id: string,
  status: Invoice["status"],
): WorkshopSnapshot {
  return {
    ...state,
    invoices: state.invoices.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            paidAt: status === "pagada" ? new Date().toISOString() : "",
          }
        : item,
    ),
  };
}

export function upsertAppointment(
  state: WorkshopSnapshot,
  input: Omit<Appointment, "id" | "organizationId"> & { id?: string },
): WorkshopSnapshot {
  requireOrg(state.customers, input.customerId, "Cliente");
  if (new Date(input.endsAt) <= new Date(input.startsAt)) {
    throw new DomainError("La hora de fin debe ser posterior al inicio");
  }
  if (input.id) {
    return {
      ...state,
      appointments: state.appointments.map((item) =>
        item.id === input.id ? { ...item, ...input, id: item.id, organizationId: item.organizationId } : item,
      ),
    };
  }
  const appointment: Appointment = {
    id: createId(),
    organizationId: state.settings.id,
    customerId: input.customerId,
    motorcycleId: input.motorcycleId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    serviceType: input.serviceType.trim(),
    notes: input.notes.trim(),
    status: input.status,
    reminderSentAt: "",
  };
  return { ...state, appointments: [appointment, ...state.appointments] };
}

export function markReminderSent(state: WorkshopSnapshot, id: string): WorkshopSnapshot {
  return {
    ...state,
    appointments: state.appointments.map((item) =>
      item.id === id ? { ...item, reminderSentAt: new Date().toISOString() } : item,
    ),
  };
}

export function upsertUser(
  state: WorkshopSnapshot,
  input: Omit<AppUser, "id" | "organizationId" | "createdAt"> & { id?: string },
): WorkshopSnapshot {
  if (!input.fullName.trim() || !input.email.trim()) {
    throw new DomainError("Nombre y correo son obligatorios");
  }
  const email = input.email.trim().toLowerCase();
  const duplicate = state.users.find((item) => item.email === email && item.id !== input.id);
  if (duplicate) throw new DomainError("Ya existe un usuario con ese correo");
  if (input.id) {
    const current = state.users.find((item) => item.id === input.id);
    const otherActiveAdmins = state.users.filter(
      (item) => item.id !== input.id && item.role === "admin" && item.active,
    );
    if (
      current?.role === "admin" &&
      current.active &&
      (input.role !== "admin" || !input.active) &&
      otherActiveAdmins.length === 0
    ) {
      throw new DomainError("Debe quedar al menos un administrador activo");
    }
    return {
      ...state,
      users: state.users.map((item) =>
        item.id === input.id
          ? {
              ...item,
              fullName: input.fullName.trim(),
              email,
              role: input.role,
              active: input.active,
              password: input.password ? input.password : item.password,
            }
          : item,
      ),
    };
  }
  if (!input.password) throw new DomainError("La contraseña es obligatoria");
  const user: AppUser = {
    id: createId(),
    organizationId: state.settings.id,
    fullName: input.fullName.trim(),
    email,
    password: input.password,
    role: input.role,
    active: input.active,
    createdAt: new Date().toISOString(),
  };
  return { ...state, users: [...state.users, user] };
}

export function updateSettings(
  state: WorkshopSnapshot,
  settings: WorkshopSettings,
): WorkshopSnapshot {
  if (!settings.name.trim()) throw new DomainError("El nombre del taller es obligatorio");
  if (settings.ivaRate < 0 || settings.ivaRate > 100) {
    throw new DomainError("El IVA debe estar entre 0 y 100");
  }
  return { ...state, settings };
}

export function setDashboardLayout(
  state: WorkshopSnapshot,
  dashboardLayout: string[],
): WorkshopSnapshot {
  return { ...state, dashboardLayout };
}

export function workOrderAmount(order: WorkOrder): number {
  const labor = order.labor.reduce((sum, line) => sum + laborTotal(line.hours, line.rate), 0);
  const parts = order.parts.reduce((sum, line) => sum + lineTotal(line.quantity, line.unitPrice), 0);
  return labor + parts;
}

export function invoiceAmount(invoice: Invoice): number {
  return documentTotals(invoice.lines, invoice.ivaRate).total;
}

export function quoteAmount(quote: Quote): number {
  return documentTotals(quote.lines, quote.ivaRate).total;
}

export function registerWorkshop(
  state: WorkshopSnapshot,
  input: { workshopName: string; fullName: string; email: string; password: string },
): WorkshopSnapshot {
  if (!input.workshopName.trim() || !input.fullName.trim()) {
    throw new DomainError("Completa el nombre del taller y el responsable");
  }
  const exists = state.users.some(
    (item) => item.email.toLowerCase() === input.email.trim().toLowerCase(),
  );
  if (exists) throw new DomainError("Ese correo ya está registrado en esta demostración");
  const orgId = createId();
  const userId = createId();
  const now = new Date().toISOString();
  return {
    ...state,
    currentUserId: userId,
    settings: {
      ...state.settings,
      id: orgId,
      name: input.workshopName.trim(),
    },
    users: [
      {
        id: userId,
        organizationId: orgId,
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        role: "admin" as Role,
        active: true,
        createdAt: now,
      },
      ...state.users,
    ],
  };
}
