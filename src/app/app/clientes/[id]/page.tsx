"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Badge, Button, Card, Field, PageHeader } from "@/components/ui";
import { upsertCustomer, useWorkshop } from "@/lib/data/workshop-context";
import { formatDate } from "@/lib/format";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { snapshot, run, notify, allowed } = useWorkshop();
  const customer = snapshot.customers.find((item) => item.id === id);
  const [form, setForm] = useState(customer);

  if (!customer || !form) return <p>Cliente no encontrado.</p>;
  const motos = snapshot.motorcycles.filter((item) => item.customerId === id);
  const orders = snapshot.workOrders.filter((item) => item.customerId === id);

  return (
    <div className="grid gap-6">
      <PageHeader title={customer.name} subtitle="Ficha e historial de servicios del cliente." />
      <Card>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (run((state) => upsertCustomer(state, form))) notify("ok", "Cliente actualizado");
          }}
        >
          {(
            [
              ["name", "Nombre"],
              ["phone", "Teléfono"],
              ["email", "Correo"],
              ["documentId", "Documento"],
              ["address", "Dirección"],
              ["notes", "Notas"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input className="input-surface" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </Field>
          ))}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={!allowed("customers")}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Card>
      <Card>
        <h2 className="font-display mb-3 text-xl font-bold">Motocicletas</h2>
        <div className="grid gap-2">
          {motos.map((item) => (
            <Link key={item.id} className="rounded-lg border border-line px-3 py-2" href={`/app/motos/${item.id}`}>
              {item.brand} {item.model} · {item.plate}
            </Link>
          ))}
          {motos.length === 0 ? <p className="text-sm text-muted">Sin motos registradas.</p> : null}
        </div>
      </Card>
      <Card>
        <h2 className="font-display mb-3 text-xl font-bold">Historial de servicios</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>OT</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((item) => (
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
