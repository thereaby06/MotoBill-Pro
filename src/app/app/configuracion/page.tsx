"use client";

import { FormEvent, useState } from "react";
import { Button, Card, Field, FormGrid, Guard, PageHeader } from "@/components/ui";
import { updateSettings, useWorkshop } from "@/lib/data/workshop-context";

export default function SettingsPage() {
  const { snapshot, allowed, run, notify, resetDemo, demoMode } = useWorkshop();
  const [form, setForm] = useState(snapshot.settings);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (run((state) => updateSettings(state, form))) notify("ok", "Configuración guardada");
  }

  return (
    <Guard allowed={allowed("settings")}>
      <PageHeader
        title="Configuración"
        subtitle="Datos del taller, IVA y numeración consecutiva de documentos."
      />
      <Card>
        <FormGrid onSubmit={onSubmit}>
          <Field label="Nombre del taller">
            <input className="input-surface" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="NIT / documento">
            <input className="input-surface" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
          </Field>
          <Field label="Dirección">
            <input className="input-surface" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <input className="input-surface" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Correo">
            <input className="input-surface" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="IVA %">
            <input
              className="input-surface"
              type="number"
              min={0}
              max={100}
              value={form.ivaRate}
              onChange={(e) => setForm({ ...form, ivaRate: Number(e.target.value) })}
            />
          </Field>
          <Field label="Moneda">
            <input className="input-surface" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </Field>
          <Field label="Prefijo OT">
            <input className="input-surface" value={form.workOrderPrefix} onChange={(e) => setForm({ ...form, workOrderPrefix: e.target.value })} />
          </Field>
          <Field label="Prefijo cotización">
            <input className="input-surface" value={form.quotePrefix} onChange={(e) => setForm({ ...form, quotePrefix: e.target.value })} />
          </Field>
          <Field label="Prefijo factura">
            <input className="input-surface" value={form.invoicePrefix} onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">Guardar configuración</Button>
          </div>
        </FormGrid>
      </Card>
      <Card className="mt-6">
        <h2 className="font-display text-xl font-bold">
          {demoMode ? "Datos de demostración" : "Persistencia"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {demoMode
            ? "Supabase no está configurado. El taller vive en localStorage de este navegador."
            : "Este taller se guarda en Supabase (PostgreSQL con RLS). Cada cambio se sincroniza automáticamente desde este dispositivo."}
        </p>
        <Button
          className="mt-4"
          type="button"
          variant="ghost"
          onClick={() => {
            const message = demoMode
              ? "Esto restaura clientes, motos, inventario y documentos de demostración."
              : "Esto vuelve a leer el taller desde Supabase y descarta cambios locales sin guardar.";
            if (window.confirm(message)) {
              void resetDemo();
            }
          }}
        >
          {demoMode ? "Restaurar datos demo" : "Recargar desde Supabase"}
        </Button>
      </Card>
    </Guard>
  );
}
