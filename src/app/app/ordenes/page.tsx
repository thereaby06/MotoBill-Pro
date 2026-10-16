"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, EmptyState, Guard, PageHeader } from "@/components/ui";
import { useWorkshop } from "@/lib/data/workshop-context";
import { formatDate } from "@/lib/format";
import type { WorkOrderStatus } from "@/lib/types";

const FILTERS: { id: "all" | WorkOrderStatus; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "recibido", label: "Recibido" },
  { id: "en_revision", label: "En revisión" },
  { id: "en_reparacion", label: "En reparación" },
  { id: "listo", label: "Listo" },
  { id: "entregado", label: "Entregado" },
];

export default function OrdersPage() {
  const { snapshot, allowed } = useWorkshop();
  const [filter, setFilter] = useState<"all" | WorkOrderStatus>("all");
  const rows = snapshot.workOrders.filter((item) => (filter === "all" ? true : item.status === filter));

  return (
    <Guard allowed={allowed("work_orders")}>
      <PageHeader
        title="Órdenes de servicio"
        subtitle="Seguimiento de diagnóstico, mano de obra y estado del vehículo."
        actions={
          <Link className="btn btn-primary" href="/app/ordenes/nueva">
            Nueva OT
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            className={`btn ${filter === item.id ? "btn-accent" : "btn-ghost"}`}
            type="button"
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Sin órdenes" text="Crea una OT cuando reciba una moto." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Placa</th>
                <th>Estado</th>
                <th>Ingreso</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const customer = snapshot.customers.find((row) => row.id === item.customerId);
                const moto = snapshot.motorcycles.find((row) => row.id === item.motorcycleId);
                return (
                  <tr key={item.id}>
                    <td>
                      <Link className="font-bold text-accent" href={`/app/ordenes/${item.id}`}>
                        {item.number}
                      </Link>
                    </td>
                    <td>{customer?.name}</td>
                    <td>{moto?.plate}</td>
                    <td>
                      <Badge status={item.status} />
                    </td>
                    <td>{formatDate(item.receivedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Guard>
  );
}
