"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button, EmptyState, Field, FormGrid, Guard, Modal, PageHeader } from "@/components/ui";
import { upsertMotorcycle, useWorkshop } from "@/lib/data/workshop-context";

export default function MotosPage() {
  const { snapshot, allowed, run, notify } = useWorkshop();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    customerId: snapshot.customers[0]?.id ?? "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    plate: "",
    vin: "",
    mileage: 0,
    photoDataUrl: "",
    notes: "",
  });

  const rows = snapshot.motorcycles.filter((item) =>
    `${item.plate} ${item.brand} ${item.model}`.toLowerCase().includes(query.toLowerCase()),
  );

  function onPhoto(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_500_000) {
      notify("error", "La foto debe pesar menos de 1.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, photoDataUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (run((state) => upsertMotorcycle(state, form))) {
      notify("ok", "Motocicleta guardada");
      setOpen(false);
    }
  }

  return (
    <Guard allowed={allowed("motorcycles")}>
      <PageHeader
        title="Motocicletas"
        subtitle="Placa, VIN, kilometraje y ficha técnica."
        actions={<Button onClick={() => setOpen(true)}>Nueva moto</Button>}
      />
      <input className="input-surface mb-4 max-w-md" placeholder="Buscar por placa o modelo" value={query} onChange={(e) => setQuery(e.target.value)} />
      {rows.length === 0 ? (
        <EmptyState title="Sin motos" text="Registra la primera motocicleta." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((item) => {
            const owner = snapshot.customers.find((customer) => customer.id === item.customerId);
            return (
              <Link key={item.id} href={`/app/motos/${item.id}`} className="card-surface p-4 hover:rim">
                {item.photoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photoDataUrl} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />
                ) : (
                  <div className="mb-3 grid h-32 place-items-center rounded-lg bg-[#141414] text-muted">Sin foto</div>
                )}
                <p className="font-display text-xl font-bold">
                  {item.brand} {item.model}
                </p>
                <p className="text-cyan">{item.plate}</p>
                <p className="text-sm text-muted">{owner?.name} · {item.year} · {item.mileage} km</p>
              </Link>
            );
          })}
        </div>
      )}
      <Modal open={open} title="Nueva motocicleta" onClose={() => setOpen(false)}>
        <FormGrid onSubmit={onSubmit}>
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
            <input className="input-surface" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} required />
          </Field>
          <Field label="Marca">
            <input className="input-surface" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
          </Field>
          <Field label="Modelo">
            <input className="input-surface" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
          </Field>
          <Field label="Año">
            <input className="input-surface" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          </Field>
          <Field label="Kilometraje">
            <input className="input-surface" type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })} />
          </Field>
          <Field label="VIN" hint="17 caracteres o vacío">
            <input className="input-surface" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
          </Field>
          <Field label="Foto">
            <input className="input-surface" type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">Guardar</Button>
          </div>
        </FormGrid>
      </Modal>
      {rows.length > 0 ? (
        <p className="mt-4 text-xs text-muted">
          Para eliminar una moto abre su ficha. No se elimina si tiene historial de OT.
        </p>
      ) : null}
    </Guard>
  );
}
