"use client";

import { useRouter } from "next/navigation";
import { use } from "react";
import { WorkOrderForm } from "@/components/work-order-form";
import { Button, Guard, PageHeader } from "@/components/ui";
import { invoiceFromWorkOrder, upsertWorkOrder, useWorkshop } from "@/lib/data/workshop-context";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { snapshot, allowed, run, notify } = useWorkshop();
  const router = useRouter();
  const order = snapshot.workOrders.find((item) => item.id === id);
  if (!order) return <p>Orden no encontrada.</p>;

  return (
    <Guard allowed={allowed("work_orders")}>
      <PageHeader
        title={order.number}
        subtitle="Edita diagnóstico, piezas, estado y firma."
        actions={
          allowed("invoices") ? (
            <Button
              type="button"
              variant="accent"
              onClick={() => {
                if (run((state) => invoiceFromWorkOrder(state, id))) {
                  notify("ok", "Factura generada desde la OT");
                  router.push("/app/facturas");
                }
              }}
            >
              Generar factura
            </Button>
          ) : undefined
        }
      />
      <WorkOrderForm
        initial={order}
        onSave={(payload) => {
          if (run((state) => upsertWorkOrder(state, payload, order))) {
            notify("ok", "Orden actualizada");
          }
        }}
      />
    </Guard>
  );
}
