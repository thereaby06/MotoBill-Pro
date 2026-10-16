"use client";

import { use } from "react";
import { DocumentEditor } from "@/components/document-editor";
import { PrintableDocument, printAndEmail } from "@/components/printable";
import { Button, Guard, PageHeader } from "@/components/ui";
import { convertQuoteToInvoice, upsertQuote, useWorkshop } from "@/lib/data/workshop-context";

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { snapshot, allowed, run, notify } = useWorkshop();
  const quote = snapshot.quotes.find((item) => item.id === id);
  if (!quote) return <p>Cotización no encontrada.</p>;
  const customer = snapshot.customers.find((item) => item.id === quote.customerId);

  return (
    <Guard allowed={allowed("quotes")}>
      <PageHeader
        title={quote.number}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                printAndEmail(
                  customer?.email || snapshot.settings.email,
                  `${quote.number} · ${snapshot.settings.name}`,
                  `Adjunto cotización ${quote.number}.`,
                )
              }
            >
              PDF / Email
            </Button>
            {quote.status !== "convertida" ? (
              <Button
                type="button"
                variant="accent"
                onClick={() => {
                  if (run((state) => convertQuoteToInvoice(state, quote.id))) notify("ok", "Convertida a factura");
                }}
              >
                Convertir a factura
              </Button>
            ) : null}
          </>
        }
      />
      <DocumentEditor
        customerId={quote.customerId}
        motorcycleId={quote.motorcycleId}
        notes={quote.notes}
        validUntil={quote.validUntil}
        ivaRate={quote.ivaRate}
        lines={quote.lines}
        showValidity
        onSave={(payload) => {
          if (run((state) => upsertQuote(state, { ...quote, ...payload }))) notify("ok", "Cotización actualizada");
        }}
      />
      <PrintableDocument
        title="Cotización"
        number={quote.number}
        customer={customer}
        settings={snapshot.settings}
        lines={quote.lines}
        ivaRate={quote.ivaRate}
        notes={quote.notes}
        extra={`Vigente hasta ${quote.validUntil || "sin fecha"}`}
      />
    </Guard>
  );
}
