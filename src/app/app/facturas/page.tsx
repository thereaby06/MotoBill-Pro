"use client";

import Link from "next/link";
import { Badge, EmptyState, Guard, PageHeader } from "@/components/ui";
import { invoiceAmount } from "@/lib/data/mutations";
import { useWorkshop } from "@/lib/data/workshop-context";
import { formatDate, money } from "@/lib/format";

export default function InvoicesPage() {
  const { snapshot, allowed } = useWorkshop();
  return (
    <Guard allowed={allowed("invoices")}>
      <PageHeader title="Facturas" subtitle="Numeración consecutiva, IVA configurable y cobro." />
      {snapshot.invoices.length === 0 ? (
        <EmptyState title="Sin facturas" text="Convierte una cotización o genera una factura desde una OT." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Emisión</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.invoices.map((item) => {
                const customer = snapshot.customers.find((row) => row.id === item.customerId);
                return (
                  <tr key={item.id}>
                    <td>
                      <Link className="font-bold text-accent" href={`/app/facturas/${item.id}`}>
                        {item.number}
                      </Link>
                    </td>
                    <td>{customer?.name}</td>
                    <td>
                      <Badge status={item.status} />
                    </td>
                    <td>{money(invoiceAmount(item), snapshot.settings.currency)}</td>
                    <td>{formatDate(item.issuedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Guard>
  );
}
