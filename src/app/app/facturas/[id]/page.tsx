"use client";

import { use } from "react";
import { PrintableDocument, printAndEmail } from "@/components/printable";
import { Button, Guard, PageHeader } from "@/components/ui";
import { setInvoiceStatus, useWorkshop } from "@/lib/data/workshop-context";
import { documentTotals, money } from "@/lib/format";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { snapshot, allowed, run, notify } = useWorkshop();
  const invoice = snapshot.invoices.find((item) => item.id === id);
  if (!invoice) return <p>Factura no encontrada.</p>;
  const customer = snapshot.customers.find((item) => item.id === invoice.customerId);
  const totals = documentTotals(invoice.lines, invoice.ivaRate);

  return (
    <Guard allowed={allowed("invoices")}>
      <PageHeader
        title={invoice.number}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                printAndEmail(
                  customer?.email || snapshot.settings.email,
                  `${invoice.number} · ${snapshot.settings.name}`,
                  `Adjunto factura ${invoice.number}.`,
                )
              }
            >
              PDF / Email
            </Button>
            {invoice.status !== "pagada" ? (
              <Button
                type="button"
                onClick={() => {
                  if (run((state) => setInvoiceStatus(state, id, "pagada"))) notify("ok", "Marcada como pagada");
                }}
              >
                Marcar pagada
              </Button>
            ) : null}
            {invoice.status !== "anulada" ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (run((state) => setInvoiceStatus(state, id, "anulada"))) notify("ok", "Factura anulada");
                }}
              >
                Anular
              </Button>
            ) : null}
          </>
        }
      />
      <div className="card-surface p-5">
        <p className="text-muted">{customer?.name}</p>
        <div className="mt-4 grid gap-2 text-sm">
          {invoice.lines.map((line) => (
            <p key={line.id}>
              {line.description} · {line.quantity} × {money(line.unitPrice, snapshot.settings.currency)}
            </p>
          ))}
        </div>
        <p className="mt-4">Subtotal {money(totals.subtotal, snapshot.settings.currency)}</p>
        <p>IVA {invoice.ivaRate}% {money(totals.tax, snapshot.settings.currency)}</p>
        <p className="text-2xl font-black text-cta">Total {money(totals.total, snapshot.settings.currency)}</p>
      </div>
      <PrintableDocument
        title="Factura"
        number={invoice.number}
        customer={customer}
        settings={snapshot.settings}
        lines={invoice.lines}
        ivaRate={invoice.ivaRate}
        notes={invoice.notes}
      />
    </Guard>
  );
}
