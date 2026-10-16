"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Badge, Button, Card, Field, PageHeader } from "@/components/ui";
import { deleteMotorcycle, upsertMotorcycle, useWorkshop } from "@/lib/data/workshop-context";
import { formatDate } from "@/lib/format";
import { useRouter } from "next/navigation";

export default function MotoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { snapshot, run, notify } = useWorkshop();
  const moto = snapshot.motorcycles.find((item) => item.id === id);
  const [form, setForm] = useState(moto);

  if (!moto || !form) return <p>Motocicleta no encontrada.</p>;
  const owner = snapshot.customers.find((item) => item.id === moto.customerId);
  const history = snapshot.workOrders.filter((item) => item.motorcycleId === id);

  return (
    <div className="grid gap-6">
      <PageHeader title={`${moto.brand} ${moto.model}`} subtitle={moto.plate} />
      <Card>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (run((state) => upsertMotorcycle(state, form))) notify("ok", "Moto actualizada");
          }}
        >
          <Field label="Cliente">
            <select className="input-surface" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              {snapshot.customers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Placa">
            <input className="input-surface" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
          </Field>
          <Field label="Marca">
            <input className="input-surface" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </Field>
          <Field label="Modelo">
            <input className="input-surface" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </Field>
          <Field label="Año">
            <input className="input-surface" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          </Field>
          <Field label="Kilometraje">
            <input className="input-surface" type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })} />
          </Field>
          <Field label="VIN">
            <input className="input-surface" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
          </Field>
          <Field label="Notas">
            <input className="input-surface" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">Guardar</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (run((state) => deleteMotorcycle(state, id))) {
                  notify("ok", "Motocicleta eliminada");
                  router.push("/app/motos");
                }
              }}
            >
              Eliminar
            </Button>
          </div>
        </form>
      </Card>
      <Card>
        <p className="mb-2 text-sm text-muted">Propietario: {owner?.name}</p>
        <h2 className="font-display text-xl font-bold">Historial de la moto</h2>
        <div className="mt-3 table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>OT</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link className="text-accent" href={`/app/ordenes/${item.id}`}>
                      {item.number}
                    </Link>
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <Badge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
