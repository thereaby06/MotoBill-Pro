"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, Guard } from "@/components/ui";
import { setDashboardLayout, useWorkshop } from "@/lib/data/workshop-context";
import { formatDateTime, money } from "@/lib/format";
import { buildMetrics } from "@/lib/metrics";

const TITLES: Record<string, string> = {
  sales: "Ventas",
  orders: "Órdenes pendientes",
  stock: "Alertas de stock",
  profit: "Ganancia estimada",
  topParts: "Repuestos más vendidos",
  frequentCustomers: "Clientes frecuentes",
  agenda: "Próximas citas",
  chart: "Ventas últimos 6 meses",
};

export default function DashboardPage() {
  const { snapshot, run, allowed } = useWorkshop();
  const metrics = useMemo(() => buildMetrics(snapshot), [snapshot]);
  const [dragId, setDragId] = useState<string | null>(null);
  const upcoming = snapshot.appointments
    .filter((item) => item.status === "programada")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 4);

  function onDrop(target: string) {
    if (!dragId || dragId === target) return;
    const layout = [...snapshot.dashboardLayout];
    const from = layout.indexOf(dragId);
    const to = layout.indexOf(target);
    if (from < 0 || to < 0) return;
    layout.splice(from, 1);
    layout.splice(to, 0, dragId);
    run((state) => setDashboardLayout(state, layout));
    setDragId(null);
  }

  const widgets: Record<string, React.ReactNode> = {
    sales: (
      <div className="grid gap-2">
        <p>Hoy: {money(metrics.salesDay, snapshot.settings.currency)}</p>
        <p>Mes: {money(metrics.salesMonth, snapshot.settings.currency)}</p>
        <p>Año: {money(metrics.salesYear, snapshot.settings.currency)}</p>
      </div>
    ),
    orders: (
      <div>
        <p className="font-display text-4xl font-black text-cyan">{metrics.pendingOrders}</p>
        <Link className="text-sm text-accent" href="/app/ordenes">
          Ver órdenes
        </Link>
      </div>
    ),
    stock: (
      <div className="grid gap-2">
        {metrics.lowStock.length === 0 ? (
          <p className="text-sm text-muted">Sin alertas de stock.</p>
        ) : (
          metrics.lowStock.map((item) => (
            <p key={item.id} className="text-sm">
              <span className="text-hot">{item.code}</span> · {item.description} ({item.stock})
            </p>
          ))
        )}
      </div>
    ),
    profit: (
      <p className="font-display text-3xl font-black text-cta">
        {money(metrics.profit, snapshot.settings.currency)}
      </p>
    ),
    topParts: (
      <ul className="grid gap-1 text-sm">
        {metrics.topParts.length === 0 ? <li className="text-muted">Aún no hay ventas de repuestos.</li> : null}
        {metrics.topParts.map(([name, qty]) => (
          <li key={name}>
            {name} · {qty}
          </li>
        ))}
      </ul>
    ),
    frequentCustomers: (
      <ul className="grid gap-1 text-sm">
        {metrics.frequentCustomers.map((item) => (
          <li key={item.id}>
            <Link className="text-accent" href={`/app/clientes/${item.id}`}>
              {item.name}
            </Link>{" "}
            · {item.count} OT
          </li>
        ))}
      </ul>
    ),
    agenda: (
      <ul className="grid gap-2 text-sm">
        {upcoming.length === 0 ? <li className="text-muted">No hay citas programadas.</li> : null}
        {upcoming.map((item) => (
          <li key={item.id}>
            {formatDateTime(item.startsAt)} · {item.serviceType}
          </li>
        ))}
      </ul>
    ),
    chart: (
      <div className="flex h-36 items-end gap-2">
        {metrics.monthSales.map((item) => {
          const max = Math.max(...metrics.monthSales.map((row) => row.value), 1);
          const height = Math.max(8, (item.value / max) * 120);
          return (
            <div key={item.label} className="grid flex-1 justify-items-center gap-1">
              <div
                className="w-full rounded-t-md bg-linear-to-t from-accent to-cyan"
                style={{ height }}
                title={money(item.value, snapshot.settings.currency)}
              />
              <span className="text-[11px] text-muted uppercase">{item.label}</span>
            </div>
          );
        })}
      </div>
    ),
  };

  return (
    <Guard allowed={allowed("dashboard")}>
    <div className="enter">
      <h1 className="font-display mb-2 text-3xl font-black">Panel de {snapshot.settings.name}</h1>
      <p className="mb-6 text-sm text-muted">Arrastra las tarjetas para reorganizar tu dashboard.</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.dashboardLayout.map((id) => (
          <Card
            key={id}
            className="cursor-grab"
          >
            <div
              draggable
              onDragStart={() => setDragId(id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDrop(id)}
            >
              <p className="mb-3 text-xs font-bold tracking-widest text-muted uppercase">{TITLES[id]}</p>
              {widgets[id]}
            </div>
          </Card>
        ))}
      </div>
    </div>
    </Guard>
  );
}
