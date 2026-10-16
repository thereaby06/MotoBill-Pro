"use client";

import { documentTotals, formatDate, money } from "@/lib/format";
import type { Customer, DocumentLine, WorkshopSettings } from "@/lib/types";

export function PrintableDocument({
  title,
  number,
  customer,
  settings,
  lines,
  ivaRate,
  notes,
  extra,
}: {
  title: string;
  number: string;
  customer?: Customer;
  settings: WorkshopSettings;
  lines: DocumentLine[];
  ivaRate: number;
  notes: string;
  extra?: string;
}) {
  const totals = documentTotals(lines, ivaRate);
  return (
    <div id="print-root" className="hidden print:block">
      <div className="p-8 text-black">
        <h1 className="text-2xl font-black">
          {settings.name} · {title} {number}
        </h1>
        <p>
          {settings.address} · {settings.phone} · NIT {settings.taxId}
        </p>
        <p>Cliente: {customer?.name} · {customer?.documentId}</p>
        <p>Fecha: {formatDate(new Date().toISOString())}</p>
        {extra ? <p>{extra}</p> : null}
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr>
              <th align="left">Descripción</th>
              <th>Cant.</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <td>{line.description}</td>
                <td align="center">{line.quantity}</td>
                <td align="right">{money(line.quantity * line.unitPrice, settings.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Subtotal {money(totals.subtotal, settings.currency)}</p>
        <p>IVA {ivaRate}% {money(totals.tax, settings.currency)}</p>
        <p className="text-xl font-black">Total {money(totals.total, settings.currency)}</p>
        <p>{notes}</p>
      </div>
    </div>
  );
}

export function printAndEmail(email: string, subject: string, body: string) {
  window.print();
  const href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    `${body}\n\nAdjunta el PDF generado con Imprimir → Guardar como PDF.`,
  )}`;
  window.location.href = href;
}
