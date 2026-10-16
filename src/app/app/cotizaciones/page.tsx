"use client";

import Link from "next/link";
import { useState } from "react";
import { DocumentEditor } from "@/components/document-editor";
import { Badge, Button, EmptyState, Guard, Modal, PageHeader } from "@/components/ui";
import { convertQuoteToInvoice, upsertQuote, useWorkshop } from "@/lib/data/workshop-context";
import { formatDate, money } from "@/lib/format";
import { quoteAmount } from "@/lib/data/mutations";

export default function QuotesPage() {
  const { snapshot, allowed, run, notify } = useWorkshop();
  const [open, setOpen] = useState(false);

  return (
    <Guard allowed={allowed("quotes")}>
      <PageHeader
        title="Cotizaciones"
        subtitle="Genera propuestas y conviértelas en factura con un clic."
        actions={<Button onClick={() => setOpen(true)}>Nueva cotización</Button>}
      />
      {snapshot.quotes.length === 0 ? (
        <EmptyState title="Sin cotizaciones" text="Crea una cotización para un cliente." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {snapshot.quotes.map((item) => {
                const customer = snapshot.customers.find((row) => row.id === item.customerId);
                return (
                  <tr key={item.id}>
                    <td>
                      <Link className="text-accent font-bold" href={`/app/cotizaciones/${item.id}`}>
                        {item.number}
                      </Link>
                    </td>
                    <td>{customer?.name}</td>
                    <td>
                      <Badge status={item.status} />
                    </td>
                    <td>{money(quoteAmount(item), snapshot.settings.currency)}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      {item.status !== "convertida" ? (
                        <button
                          className="text-sm text-cta"
                          type="button"
                          onClick={() => {
                            if (run((state) => convertQuoteToInvoice(state, item.id))) {
                              notify("ok", "Cotización convertida a factura");
                            }
                          }}
                        >
                          Convertir a factura
                        </button>
                      ) : (
                        <Link className="text-sm text-accent" href={`/app/facturas/${item.convertedInvoiceId}`}>
                          Ver factura
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} title="Nueva cotización" onClose={() => setOpen(false)}>
        <DocumentEditor
          customerId={snapshot.customers[0]?.id ?? ""}
          motorcycleId=""
          notes=""
          validUntil=""
          ivaRate={snapshot.settings.ivaRate}
          lines={[]}
          showValidity
          onSave={(payload) => {
            if (
              run((state) =>
                upsertQuote(state, {
                  ...payload,
                  status: "enviada",
                }),
              )
            ) {
              notify("ok", "Cotización creada");
              setOpen(false);
            }
          }}
        />
      </Modal>
    </Guard>
  );
}
