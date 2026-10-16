import { documentTotals } from "./format";
import type { Invoice, WorkshopSnapshot } from "./types";

function inRange(iso: string, start: Date, end: Date) {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function paidTotal(invoices: Invoice[], start: Date, end: Date) {
  return invoices
    .filter((item) => item.status === "pagada" && inRange(item.paidAt || item.issuedAt, start, end))
    .reduce((sum, item) => sum + documentTotals(item.lines, item.ivaRate).total, 0);
}

export function buildMetrics(snapshot: WorkshopSnapshot) {
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startYear = new Date(now.getFullYear(), 0, 1);
  const salesDay = paidTotal(snapshot.invoices, startDay, now);
  const salesMonth = paidTotal(snapshot.invoices, startMonth, now);
  const salesYear = paidTotal(snapshot.invoices, startYear, now);

  const profit = snapshot.invoices
    .filter((item) => item.status === "pagada")
    .reduce((sum, invoice) => {
      const totals = documentTotals(invoice.lines, invoice.ivaRate);
      const cost = invoice.lines.reduce((acc, line) => {
        if (line.kind !== "part") return acc;
        const match = snapshot.inventory.find((item) => item.description === line.description);
        const unitCost = match ? match.purchasePrice : line.unitPrice * 0.6;
        return acc + unitCost * line.quantity;
      }, 0);
      return sum + (totals.subtotal - cost);
    }, 0);

  const pendingOrders = snapshot.workOrders.filter((item) => item.status !== "entregado").length;
  const lowStock = snapshot.inventory.filter((item) => item.stock <= item.minStock);

  const partSales = new Map<string, number>();
  for (const invoice of snapshot.invoices.filter((item) => item.status !== "anulada")) {
    for (const line of invoice.lines.filter((item) => item.kind === "part")) {
      partSales.set(line.description, (partSales.get(line.description) ?? 0) + line.quantity);
    }
  }
  const topParts = [...partSales.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const customerCount = new Map<string, number>();
  for (const order of snapshot.workOrders) {
    customerCount.set(order.customerId, (customerCount.get(order.customerId) ?? 0) + 1);
  }
  const frequentCustomers = [...customerCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      id,
      name: snapshot.customers.find((item) => item.id === id)?.name ?? "Cliente",
      count,
    }));

  const monthSales = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    return {
      label: date.toLocaleDateString("es-CO", { month: "short" }),
      value: paidTotal(snapshot.invoices, date, end),
    };
  });

  return {
    salesDay,
    salesMonth,
    salesYear,
    profit,
    pendingOrders,
    lowStock,
    topParts,
    frequentCustomers,
    monthSales,
  };
}
