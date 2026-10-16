export function money(value: number, currency = "COP"): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "COP" ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function lineTotal(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function documentTotals(
  lines: { quantity: number; unitPrice: number }[],
  ivaRate: number,
) {
  const subtotal = roundMoney(
    lines.reduce((sum, line) => sum + lineTotal(line.quantity, line.unitPrice), 0),
  );
  const tax = roundMoney(subtotal * (ivaRate / 100));
  return { subtotal, tax, total: roundMoney(subtotal + tax) };
}

export function laborTotal(hours: number, rate: number): number {
  return roundMoney(hours * rate);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: undefined,
  }).format(date);
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function padNumber(value: number, size = 5): string {
  return String(value).padStart(size, "0");
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function todayInputValue(date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
