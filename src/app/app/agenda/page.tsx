"use client";

import { FormEvent, useMemo, useState } from "react";
import { Badge, Button, EmptyState, Field, FormGrid, Guard, Modal, PageHeader } from "@/components/ui";
import { markReminderSent, upsertAppointment, useWorkshop } from "@/lib/data/workshop-context";
import { formatDateTime, todayInputValue } from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/lib/types";

function toLocalInput(iso: string) {
  if (!iso) return todayInputValue();
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < start; i += 1) cells.push(null);
  for (let day = 1; day <= days; day += 1) cells.push(day);
  return cells;
}

const emptyForm = {
  customerId: "",
  motorcycleId: "",
  startsAt: todayInputValue(),
  endsAt: todayInputValue(new Date(Date.now() + 60 * 60 * 1000)),
  serviceType: "",
  notes: "",
  status: "programada" as AppointmentStatus,
};

export default function AgendaPage() {
  const { snapshot, allowed, run, notify } = useWorkshop();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);

  const cells = monthCells(cursor.year, cursor.month);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });

  const dayKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const dayAppointments = useMemo(
    () =>
      snapshot.appointments
        .filter((item) => item.startsAt.slice(0, 10) === dayKey)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [dayKey, snapshot.appointments],
  );

  function countsFor(day: number) {
    const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return snapshot.appointments.filter((item) => item.startsAt.slice(0, 10) === key).length;
  }

  function openNew() {
    setEditing(null);
    setForm({
      ...emptyForm,
      customerId: snapshot.customers[0]?.id ?? "",
      motorcycleId: snapshot.motorcycles[0]?.id ?? "",
    });
    setOpen(true);
  }

  function openEdit(item: Appointment) {
    setEditing(item);
    setForm({
      customerId: item.customerId,
      motorcycleId: item.motorcycleId,
      startsAt: toLocalInput(item.startsAt),
      endsAt: toLocalInput(item.endsAt),
      serviceType: item.serviceType,
      notes: item.notes,
      status: item.status,
    });
    setOpen(true);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      id: editing?.id,
      customerId: form.customerId,
      motorcycleId: form.motorcycleId,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      serviceType: form.serviceType,
      notes: form.notes,
      status: form.status,
      reminderSentAt: editing?.reminderSentAt ?? "",
    };
    if (run((state) => upsertAppointment(state, payload))) {
      notify("ok", editing ? "Cita actualizada" : "Cita creada");
      setOpen(false);
    }
  }

  function sendReminder(item: Appointment) {
    const customer = snapshot.customers.find((row) => row.id === item.customerId);
    if (!customer?.email) {
      notify("error", "El cliente no tiene correo para el recordatorio");
      return;
    }
    const body = `Hola ${customer.name}, te recordamos tu cita de ${item.serviceType} el ${formatDateTime(item.startsAt)} en ${snapshot.settings.name}.`;
    window.location.href = `mailto:${encodeURIComponent(customer.email)}?subject=${encodeURIComponent(
      `Recordatorio de cita · ${snapshot.settings.name}`,
    )}&body=${encodeURIComponent(body)}`;
    run((state) => markReminderSent(state, item.id));
  }

  return (
    <Guard allowed={allowed("appointments")}>
      <PageHeader
        title="Agenda"
        subtitle="Calendario de servicios programados y recordatorios por correo del cliente."
        actions={
          <Button type="button" onClick={openNew}>
            Nueva cita
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <button
              className="btn btn-ghost px-3"
              type="button"
              onClick={() =>
                setCursor((value) =>
                  value.month === 0 ? { year: value.year - 1, month: 11 } : { year: value.year, month: value.month - 1 },
                )
              }
            >
              Anterior
            </button>
            <h2 className="font-display text-lg font-bold capitalize">{monthLabel}</h2>
            <button
              className="btn btn-ghost px-3"
              type="button"
              onClick={() =>
                setCursor((value) =>
                  value.month === 11 ? { year: value.year + 1, month: 0 } : { year: value.year, month: value.month + 1 },
                )
              }
            >
              Siguiente
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted uppercase">
            {["D", "L", "M", "X", "J", "V", "S"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map((day, index) =>
              day ? (
                <button
                  key={`${day}-${index}`}
                  type="button"
                  className={`min-h-16 rounded-lg border px-1 py-2 text-sm ${
                    day === selectedDay ? "border-accent text-accent rim" : "border-line hover:bg-[#1b1b1b]"
                  }`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span className="font-bold">{day}</span>
                  {countsFor(day) > 0 ? (
                    <span className="mt-1 block text-[11px] text-cta">{countsFor(day)} cita(s)</span>
                  ) : null}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
        </section>
        <section className="card-surface p-5">
          <h2 className="font-display mb-3 text-xl font-bold">Citas del {dayKey}</h2>
          {dayAppointments.length === 0 ? (
            <EmptyState title="Sin citas" text="No hay servicios programados este día." />
          ) : (
            <ul className="grid gap-3">
              {dayAppointments.map((item) => {
                const customer = snapshot.customers.find((row) => row.id === item.customerId);
                const moto = snapshot.motorcycles.find((row) => row.id === item.motorcycleId);
                return (
                  <li key={item.id} className="rounded-xl border border-line p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold">{item.serviceType}</p>
                        <p className="text-sm text-muted">
                          {formatDateTime(item.startsAt)} · {customer?.name} · {moto?.plate ?? "Sin moto"}
                        </p>
                      </div>
                      <Badge status={item.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="ghost" onClick={() => openEdit(item)}>
                        Editar
                      </Button>
                      {item.status === "programada" ? (
                        <Button type="button" variant="ghost" onClick={() => sendReminder(item)}>
                          {item.reminderSentAt ? "Reenviar recordatorio" : "Enviar recordatorio"}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
      <Modal open={open} title={editing ? "Editar cita" : "Nueva cita"} onClose={() => setOpen(false)}>
        <FormGrid onSubmit={onSubmit}>
          <Field label="Cliente">
            <select
              className="input-surface"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value, motorcycleId: "" })}
              required
            >
              <option value="">Selecciona</option>
              {snapshot.customers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Moto">
            <select
              className="input-surface"
              value={form.motorcycleId}
              onChange={(e) => setForm({ ...form, motorcycleId: e.target.value })}
            >
              <option value="">Sin moto</option>
              {snapshot.motorcycles
                .filter((item) => item.customerId === form.customerId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.plate}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Inicio">
            <input
              className="input-surface"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              required
            />
          </Field>
          <Field label="Fin">
            <input
              className="input-surface"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              required
            />
          </Field>
          <Field label="Servicio">
            <input
              className="input-surface"
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              required
            />
          </Field>
          <Field label="Estado">
            <select
              className="input-surface"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}
            >
              <option value="programada">Programada</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </Field>
          <Field label="Notas">
            <input className="input-surface" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">Guardar cita</Button>
          </div>
        </FormGrid>
      </Modal>
    </Guard>
  );
}
