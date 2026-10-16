"use client";

import { FormEvent, useState } from "react";
import { Button, Field } from "./ui";
import { createId } from "@/lib/id";
import { documentTotals, money } from "@/lib/format";
import type { DocumentLine, LineKind } from "@/lib/types";
import { useWorkshop } from "@/lib/data/workshop-context";

export function DocumentEditor({
  customerId: initialCustomer,
  motorcycleId: initialMoto,
  notes: initialNotes,
  validUntil: initialValid,
  lines: initialLines,
  ivaRate: initialIva,
  onSave,
  showValidity,
}: {
  customerId: string;
  motorcycleId: string;
  notes: string;
  validUntil?: string;
  lines: DocumentLine[];
  ivaRate: number;
  showValidity?: boolean;
  onSave: (payload: {
    customerId: string;
    motorcycleId: string;
    notes: string;
    validUntil: string;
    ivaRate: number;
    lines: DocumentLine[];
  }) => void;
}) {
  const { snapshot } = useWorkshop();
  const [customerId, setCustomerId] = useState(initialCustomer);
  const [motorcycleId, setMotorcycleId] = useState(initialMoto);
  const [notes, setNotes] = useState(initialNotes);
  const [validUntil, setValidUntil] = useState(initialValid ?? "");
  const [ivaRate, setIvaRate] = useState(initialIva);
  const [lines, setLines] = useState<DocumentLine[]>(initialLines);
  const totals = documentTotals(lines, ivaRate);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSave({ customerId, motorcycleId, notes, validUntil, ivaRate, lines });
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cliente">
          <select className="input-surface" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {snapshot.customers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Moto">
          <select className="input-surface" value={motorcycleId} onChange={(e) => setMotorcycleId(e.target.value)}>
            <option value="">Sin moto</option>
            {snapshot.motorcycles
              .filter((item) => item.customerId === customerId)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.plate}
                </option>
              ))}
          </select>
        </Field>
        {showValidity ? (
          <Field label="Vigente hasta">
            <input className="input-surface" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </Field>
        ) : null}
        <Field label="IVA %">
          <input className="input-surface" type="number" value={ivaRate} onChange={(e) => setIvaRate(Number(e.target.value))} />
        </Field>
      </div>
      <div className="flex justify-between">
        <h3 className="font-display font-bold">Líneas</h3>
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            setLines((rows) => [
              ...rows,
              { id: createId(), kind: "labor", description: "", quantity: 1, unitPrice: 0 },
            ])
          }
        >
          Agregar línea
        </Button>
      </div>
      {lines.map((line) => (
        <div key={line.id} className="grid gap-2 sm:grid-cols-5">
          <select
            className="input-surface"
            value={line.kind}
            onChange={(e) =>
              setLines((rows) => rows.map((row) => (row.id === line.id ? { ...row, kind: e.target.value as LineKind } : row)))
            }
          >
            <option value="labor">Mano de obra</option>
            <option value="part">Repuesto</option>
          </select>
          <input
            className="input-surface sm:col-span-2"
            placeholder="Descripción"
            value={line.description}
            onChange={(e) =>
              setLines((rows) => rows.map((row) => (row.id === line.id ? { ...row, description: e.target.value } : row)))
            }
          />
          <input
            className="input-surface"
            type="number"
            value={line.quantity}
            onChange={(e) =>
              setLines((rows) => rows.map((row) => (row.id === line.id ? { ...row, quantity: Number(e.target.value) } : row)))
            }
          />
          <input
            className="input-surface"
            type="number"
            value={line.unitPrice}
            onChange={(e) =>
              setLines((rows) =>
                rows.map((row) => (row.id === line.id ? { ...row, unitPrice: Number(e.target.value) } : row)),
              )
            }
          />
        </div>
      ))}
      <Field label="Notas">
        <textarea className="input-surface" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="rounded-xl border border-line p-4 text-sm">
        <p>Subtotal: {money(totals.subtotal, snapshot.settings.currency)}</p>
        <p>IVA: {money(totals.tax, snapshot.settings.currency)}</p>
        <p className="text-lg font-black text-cta">Total: {money(totals.total, snapshot.settings.currency)}</p>
      </div>
      <Button type="submit">Guardar</Button>
    </form>
  );
}
