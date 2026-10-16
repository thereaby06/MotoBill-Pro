"use client";

import { FormEvent, useMemo, useState } from "react";
import { SignaturePad } from "./signature-pad";
import { Button, Field } from "./ui";
import { createId } from "@/lib/id";
import type { LaborLine, PartLine, WorkOrder, WorkOrderStatus } from "@/lib/types";
import { useWorkshop } from "@/lib/data/workshop-context";

const STATUSES: WorkOrderStatus[] = [
  "recibido",
  "en_revision",
  "en_reparacion",
  "listo",
  "entregado",
];

export function WorkOrderForm({
  initial,
  onSave,
}: {
  initial?: WorkOrder;
  onSave: (payload: Omit<WorkOrder, "id" | "organizationId" | "number" | "createdAt"> & { id?: string }) => void;
}) {
  const { snapshot } = useWorkshop();
  const [customerId, setCustomerId] = useState(initial?.customerId ?? snapshot.customers[0]?.id ?? "");
  const motos = snapshot.motorcycles.filter((item) => item.customerId === customerId);
  const [motorcycleId, setMotorcycleId] = useState(initial?.motorcycleId ?? motos[0]?.id ?? "");
  const [status, setStatus] = useState<WorkOrderStatus>(initial?.status ?? "recibido");
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [mileageIn, setMileageIn] = useState(initial?.mileageIn ?? 0);
  const [assignedUserId, setAssignedUserId] = useState(
    initial?.assignedUserId ?? snapshot.users.find((item) => item.role === "mechanic")?.id ?? "",
  );
  const [labor, setLabor] = useState<LaborLine[]>(initial?.labor ?? []);
  const [parts, setParts] = useState<PartLine[]>(initial?.parts ?? []);
  const [signatureDataUrl, setSignatureDataUrl] = useState(initial?.signatureDataUrl ?? "");

  const mechanics = snapshot.users.filter((item) => item.active && (item.role === "mechanic" || item.role === "admin"));

  const selectedMoto = useMemo(
    () => snapshot.motorcycles.find((item) => item.id === motorcycleId),
    [motorcycleId, snapshot.motorcycles],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    onSave({
      id: initial?.id,
      customerId,
      motorcycleId,
      assignedUserId,
      status,
      diagnosis,
      notes,
      mileageIn,
      labor,
      parts,
      signatureDataUrl,
      receivedAt: initial?.receivedAt ?? new Date().toISOString(),
      deliveredAt: status === "entregado" ? initial?.deliveredAt || new Date().toISOString() : "",
    });
  }

  return (
    <form className="grid gap-6" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cliente">
          <select
            className="input-surface"
            value={customerId}
            onChange={(event) => {
              setCustomerId(event.target.value);
              const first = snapshot.motorcycles.find((item) => item.customerId === event.target.value);
              setMotorcycleId(first?.id ?? "");
            }}
          >
            {snapshot.customers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Motocicleta">
          <select className="input-surface" value={motorcycleId} onChange={(e) => setMotorcycleId(e.target.value)}>
            {motos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.plate} · {item.brand} {item.model}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado">
          <select className="input-surface" value={status} onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Asignado a">
          <select className="input-surface" value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}>
            <option value="">Sin asignar</option>
            {mechanics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.fullName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kilometraje de ingreso">
          <input className="input-surface" type="number" value={mileageIn} onChange={(e) => setMileageIn(Number(e.target.value))} />
        </Field>
        <p className="self-end text-sm text-muted">Último km registrado: {selectedMoto?.mileage ?? "—"}</p>
        <Field label="Diagnóstico">
          <textarea className="input-surface min-h-24" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </Field>
        <Field label="Notas">
          <textarea className="input-surface min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display font-bold">Mano de obra</h3>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setLabor((rows) => [...rows, { id: createId(), description: "", hours: 1, rate: 40000 }])}
          >
            Agregar
          </Button>
        </div>
        <div className="grid gap-2">
          {labor.map((line) => (
            <div key={line.id} className="grid gap-2 sm:grid-cols-4">
              <input
                className="input-surface sm:col-span-2"
                placeholder="Descripción"
                value={line.description}
                onChange={(e) =>
                  setLabor((rows) => rows.map((row) => (row.id === line.id ? { ...row, description: e.target.value } : row)))
                }
              />
              <input
                className="input-surface"
                type="number"
                step="0.1"
                value={line.hours}
                onChange={(e) =>
                  setLabor((rows) => rows.map((row) => (row.id === line.id ? { ...row, hours: Number(e.target.value) } : row)))
                }
              />
              <input
                className="input-surface"
                type="number"
                value={line.rate}
                onChange={(e) =>
                  setLabor((rows) => rows.map((row) => (row.id === line.id ? { ...row, rate: Number(e.target.value) } : row)))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display font-bold">Repuestos</h3>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              const item = snapshot.inventory[0];
              if (!item) return;
              setParts((rows) => [
                ...rows,
                {
                  id: createId(),
                  itemId: item.id,
                  description: item.description,
                  quantity: 1,
                  unitPrice: item.salePrice,
                },
              ]);
            }}
          >
            Agregar del inventario
          </Button>
        </div>
        <div className="grid gap-2">
          {parts.map((line) => (
            <div key={line.id} className="grid gap-2 sm:grid-cols-4">
              <select
                className="input-surface sm:col-span-2"
                value={line.itemId}
                onChange={(e) => {
                  const item = snapshot.inventory.find((row) => row.id === e.target.value);
                  if (!item) return;
                  setParts((rows) =>
                    rows.map((row) =>
                      row.id === line.id
                        ? { ...row, itemId: item.id, description: item.description, unitPrice: item.salePrice }
                        : row,
                    ),
                  );
                }}
              >
                {snapshot.inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.description} (stock {item.stock})
                  </option>
                ))}
              </select>
              <input
                className="input-surface"
                type="number"
                value={line.quantity}
                onChange={(e) =>
                  setParts((rows) =>
                    rows.map((row) => (row.id === line.id ? { ...row, quantity: Number(e.target.value) } : row)),
                  )
                }
              />
              <input
                className="input-surface"
                type="number"
                value={line.unitPrice}
                onChange={(e) =>
                  setParts((rows) =>
                    rows.map((row) => (row.id === line.id ? { ...row, unitPrice: Number(e.target.value) } : row)),
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display mb-2 font-bold">Firma del cliente</h3>
        <SignaturePad value={signatureDataUrl} onChange={setSignatureDataUrl} />
      </section>
      <Button type="submit">Guardar orden</Button>
    </form>
  );
}
