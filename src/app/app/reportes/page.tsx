"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button, Card, Guard, PageHeader } from "@/components/ui";
import { useWorkshop } from "@/lib/data/workshop-context";
import { formatDate, money } from "@/lib/format";
import { buildMetrics } from "@/lib/metrics";
import { invoiceAmount } from "@/lib/data/mutations";

export default function ReportsPage() {
  const { snapshot, allowed } = useWorkshop();
  const metrics = useMemo(() => buildMetrics(snapshot), [snapshot]);

  function exportCsv() {
    const rows = [
      ["numero", "cliente", "estado", "fecha", "total"],
      ...snapshot.invoices.map((invoice) => {
        const customer = snapshot.customers.find((item) => item.id === invoice.customerId);
        return [
          invoice.number,
          customer?.name ?? "",
          invoice.status,
          invoice.issuedAt,
          String(invoiceAmount(invoice)),
        ];
      }),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "motobill-facturas-demo.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Guard allowed={allowed("reports")}>
      <PageHeader
        title="Reportes"
        subtitle="Ventas, órdenes, inventario y clientes frecuentes con datos de este taller."
        actions={
          <Button type="button" variant="ghost" onClick={exportCsv}>
            Exportar facturas CSV
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs tracking-widest text-muted uppercase">Ventas del mes</p>
          <p className="font-display mt-2 text-3xl font-black text-cta">
            {money(metrics.salesMonth, snapshot.settings.currency)}
          </p>
        </Card>
        <Card>
          <p className="text-xs tracking-widest text-muted uppercase">Ganancia estimada</p>
          <p className="font-display mt-2 text-3xl font-black text-accent">
            {money(metrics.profit, snapshot.settings.currency)}
          </p>
        </Card>
        <Card>
          <p className="text-xs tracking-widest text-muted uppercase">OT pendientes</p>
          <p className="font-display mt-2 text-3xl font-black text-cyan">{metrics.pendingOrders}</p>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display mb-3 text-xl font-bold">Facturas</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <Link className="text-accent" href={`/app/facturas/${invoice.id}`}>
                        {invoice.number}
                      </Link>
                    </td>
                    <td>{formatDate(invoice.issuedAt)}</td>
                    <td>{money(invoiceAmount(invoice), snapshot.settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h2 className="font-display mb-3 text-xl font-bold">Repuestos más vendidos</h2>
          <ul className="grid gap-2 text-sm">
            {metrics.topParts.length === 0 ? <li className="text-muted">Sin ventas de repuestos.</li> : null}
            {metrics.topParts.map(([name, qty]) => (
              <li key={name}>
                {name} · {qty}
              </li>
            ))}
          </ul>
          <h2 className="font-display mt-6 mb-3 text-xl font-bold">Clientes frecuentes</h2>
          <ul className="grid gap-2 text-sm">
            {metrics.frequentCustomers.map((item) => (
              <li key={item.id}>
                <Link className="text-accent" href={`/app/clientes/${item.id}`}>
                  {item.name}
                </Link>{" "}
                · {item.count} OT
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Guard>
  );
}
