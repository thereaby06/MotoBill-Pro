"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button, EmptyState, Field, FormGrid, Guard, Modal, PageHeader } from "@/components/ui";
import { deleteCustomer, upsertCustomer, useWorkshop } from "@/lib/data/workshop-context";

export default function CustomersPage() {
  const { snapshot, allowed, run, notify } = useWorkshop();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    documentId: "",
    address: "",
    notes: "",
  });

  const rows = snapshot.customers.filter((item) =>
    `${item.name} ${item.phone} ${item.documentId}`.toLowerCase().includes(query.toLowerCase()),
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (run((state) => upsertCustomer(state, form))) {
      notify("ok", "Cliente guardado");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", documentId: "", address: "", notes: "" });
    }
  }

  return (
    <Guard allowed={allowed("customers")}>
      <PageHeader
        title="Clientes"
        subtitle="Registro de contacto y acceso al historial por persona."
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            Nuevo cliente
          </Button>
        }
      />
      <input
        className="input-surface mb-4 max-w-md"
        placeholder="Filtrar por nombre, teléfono o documento"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {rows.length === 0 ? (
        <EmptyState title="Sin clientes" text="Crea el primer cliente del taller." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Motos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link className="font-bold text-accent" href={`/app/clientes/${item.id}`}>
                      {item.name}
                    </Link>
                  </td>
                  <td>{item.phone || "—"}</td>
                  <td>{item.email || "—"}</td>
                  <td>{snapshot.motorcycles.filter((moto) => moto.customerId === item.id).length}</td>
                  <td>
                    <button
                      className="text-sm text-[#ff5c5c]"
                      type="button"
                      onClick={() => {
                        if (run((state) => deleteCustomer(state, item.id))) notify("ok", "Cliente eliminado");
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} title="Nuevo cliente" onClose={() => setOpen(false)}>
        <FormGrid onSubmit={onSubmit}>
          <Field label="Nombre">
            <input className="input-surface" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Teléfono">
            <input className="input-surface" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Correo">
            <input className="input-surface" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Documento">
            <input className="input-surface" value={form.documentId} onChange={(e) => setForm({ ...form, documentId: e.target.value })} />
          </Field>
          <Field label="Dirección">
            <input className="input-surface" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Notas">
            <input className="input-surface" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">Guardar</Button>
          </div>
        </FormGrid>
      </Modal>
    </Guard>
  );
}
