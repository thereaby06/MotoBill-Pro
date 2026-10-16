"use client";

import { FormEvent, useState } from "react";
import { Button, EmptyState, Field, FormGrid, Guard, Modal, PageHeader } from "@/components/ui";
import { upsertUser, useWorkshop } from "@/lib/data/workshop-context";
import { ROLE_LABEL } from "@/lib/permissions";
import type { AppUser, Role } from "@/lib/types";

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  role: "cashier" as Role,
  active: true,
};

export default function UsersPage() {
  const { snapshot, allowed, run, notify, demoMode, refresh } = useWorkshop();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    // Editar un usuario existente solo toca `profiles`, que el administrador
    // puede actualizar vía RLS. Crear uno nuevo necesita la API de Auth.
    if (demoMode || editing) {
      const payload = editing ? { ...form, id: editing.id } : form;
      if (run((state) => upsertUser(state, payload))) {
        notify("ok", "Usuario guardado");
        setOpen(false);
      }
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        notify("error", body?.error ?? "No se pudo crear el usuario");
        return;
      }
      await refresh();
      notify("ok", "Usuario creado");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Guard allowed={allowed("users")}>
      <PageHeader
        title="Usuarios y permisos"
        subtitle="Administrador, mecánico y cajero/recepcionista con accesos diferenciados."
        actions={
          <Button type="button" onClick={openNew}>
            Nuevo usuario
          </Button>
        }
      />
      {snapshot.users.length === 0 ? (
        <EmptyState title="Sin usuarios" text="Crea el primer acceso del taller." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {snapshot.users.map((item) => (
                <tr key={item.id}>
                  <td>{item.fullName}</td>
                  <td>{item.email}</td>
                  <td>{ROLE_LABEL[item.role]}</td>
                  <td>{item.active ? "Activo" : "Inactivo"}</td>
                  <td>
                    <button
                      className="text-sm text-accent"
                      type="button"
                      onClick={() => {
                        setEditing(item);
                        setForm({
                          fullName: item.fullName,
                          email: item.email,
                          password: "",
                          role: item.role,
                          active: item.active,
                        });
                        setOpen(true);
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} title={editing ? "Editar usuario" : "Nuevo usuario"} onClose={() => setOpen(false)}>
        <FormGrid onSubmit={onSubmit}>
          <Field label="Nombre">
            <input
              className="input-surface"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </Field>
          <Field label="Correo">
            <input
              className="input-surface"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field
            label={editing ? "Nueva contraseña (opcional)" : "Contraseña"}
            hint={
              demoMode
                ? "En modo demo se guarda en este navegador."
                : "La cuenta se crea en Supabase Auth."
            }
          >
            <input
              className="input-surface"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editing && !demoMode}
            />
          </Field>
          <Field label="Rol">
            <select
              className="input-surface"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="admin">Administrador</option>
              <option value="mechanic">Mecánico</option>
              <option value="cashier">Cajero / Recepcionista</option>
            </select>
          </Field>
          <Field label="Estado">
            <select
              className="input-surface"
              value={form.active ? "1" : "0"}
              onChange={(e) => setForm({ ...form, active: e.target.value === "1" })}
            >
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </FormGrid>
      </Modal>
    </Guard>
  );
}
