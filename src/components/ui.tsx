"use client";

import type { ButtonHTMLAttributes, FormEvent, ReactNode } from "react";
import { STATUS_LABEL } from "@/lib/permissions";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "ghost";
}) {
  return <button className={`btn btn-${variant} ${className}`} {...props} />;
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card-surface p-5 ${className}`}>{children}</section>;
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-semibold text-[#cfd3d6]">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Badge({ status }: { status: string }) {
  const palette: Record<string, string> = {
    recibido: "bg-[#2a2a2a] text-[#00e5ff]",
    en_revision: "bg-[#1d2a22] text-[#00d4aa]",
    en_reparacion: "bg-[#2a2410] text-[#ffb300]",
    listo: "bg-[#132a1c] text-[#3ee07f]",
    entregado: "bg-[#1a1a1a] text-[#9aa0a6]",
    pendiente: "bg-[#2a2410] text-[#ffb300]",
    pagada: "bg-[#132a1c] text-[#3ee07f]",
    anulada: "bg-[#2a1414] text-[#ff5c5c]",
    programada: "bg-[#1d2a22] text-[#00d4aa]",
    low: "bg-[#2a1414] text-[#ff6d00]",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${palette[status] ?? "bg-[#222] text-muted"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="max-w-md text-sm text-muted">{text}</p>
      {action}
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 enter">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="card-surface rim max-h-[90vh] w-full max-w-2xl overflow-auto p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="font-display text-xl font-bold">
            {title}
          </h2>
          <button className="btn btn-ghost px-3 py-1" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-black tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

export function FormGrid({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
      {children}
    </form>
  );
}

export function Guard({
  allowed,
  children,
}: {
  allowed: boolean;
  children: ReactNode;
}) {
  if (allowed) return <>{children}</>;
  return (
    <EmptyState
      title="Sin permiso"
      text="Tu rol no puede acceder a esta sección. Pide a un administrador que ajuste los permisos."
    />
  );
}
