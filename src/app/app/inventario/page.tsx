"use client";

import { FormEvent, useState } from "react";
import { Badge, Button, EmptyState, Field, FormGrid, Guard, Modal, PageHeader } from "@/components/ui";
import { deleteInventory, upsertInventory, useWorkshop } from "@/lib/data/workshop-context";
import { money } from "@/lib/format";
import type { InventoryItem } from "@/lib/types";

const emptyItem = {
  code: "",
  description: "",
  category: "",
  purchasePrice: 0,
  salePrice: 0,
  stock: 0,
  minStock: 0,
};

export default function InventoryPage() {
  const { snapshot, allowed, run, notify } = useWorkshop();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyItem);
  const canWrite = allowed("inventory_write");

  function openNew() {
    setEditing(null);
    setForm(emptyItem);
    setOpen(true);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = editing ? { ...form, id: editing.id } : form;
    if (run((state) => upsertInventory(state, payload))) {
      notify("ok", "Repuesto guardado");
      setOpen(false);
    }
  }

  return (
    <Guard allowed={allowed("inventory_read")}>
      <PageHeader
        title="Inventario"
        subtitle="Catálogo de repuestos con alerta automática de stock mínimo."
        actions={
          canWrite ? (
            <Button type="button" onClick={openNew}>
              Nuevo repuesto
            </Button>
          ) : undefined
        }
      />
      {snapshot.inventory.length === 0 ? (
        <EmptyState title="Inventario vacío" text="Agrega el primer código de almacén." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Compra</th>
                <th>Venta</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {snapshot.inventory.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.description}</td>
                  <td>{money(item.purchasePrice, snapshot.settings.currency)}</td>
                  <td>{money(item.salePrice, snapshot.settings.currency)}</td>
                  <td>{item.stock}</td>
                  <td>
                    {item.stock <= item.minStock ? <Badge status="low" /> : item.minStock}
                    {item.stock <= item.minStock ? <span className="ml-2 text-hot">Bajo mínimo</span> : null}
                  </td>
                  <td>
                    {canWrite ? (
                      <div className="flex gap-3">
                        <button
                          className="text-sm text-accent"
                          type="button"
                          onClick={() => {
                            setEditing(item);
                            setForm(item);
                            setOpen(true);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-sm text-[#ff5c5c]"
                          type="button"
                          onClick={() => {
                            if (run((state) => deleteInventory(state, item.id))) notify("ok", "Repuesto eliminado");
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} title={editing ? "Editar repuesto" : "Nuevo repuesto"} onClose={() => setOpen(false)}>
        <FormGrid onSubmit={onSubmit}>
          <Field label="Código">
            <input className="input-surface" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </Field>
          <Field label="Descripción">
            <input className="input-surface" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </Field>
          <Field label="Categoría">
            <input className="input-surface" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <Field label="Stock">
            <input className="input-surface" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          </Field>
          <Field label="Stock mínimo">
            <input className="input-surface" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
          </Field>
          <Field label="Precio de compra">
            <input className="input-surface" type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })} />
          </Field>
          <Field label="Precio de venta">
            <input className="input-surface" type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">Guardar</Button>
          </div>
        </FormGrid>
      </Modal>
    </Guard>
  );
}
