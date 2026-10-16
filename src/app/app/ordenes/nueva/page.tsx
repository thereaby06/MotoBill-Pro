"use client";

import { useRouter } from "next/navigation";
import { WorkOrderForm } from "@/components/work-order-form";
import { Guard, PageHeader } from "@/components/ui";
import { upsertWorkOrder, useWorkshop } from "@/lib/data/workshop-context";

export default function NewOrderPage() {
  const { allowed, run, notify } = useWorkshop();
  const router = useRouter();

  return (
    <Guard allowed={allowed("work_orders")}>
      <PageHeader title="Nueva orden de trabajo" subtitle="Registra recepción, diagnóstico y piezas." />
      <WorkOrderForm
        onSave={(payload) => {
          if (run((state) => upsertWorkOrder(state, payload))) {
            notify("ok", "Orden creada");
            router.push("/app/ordenes");
          }
        }}
      />
    </Guard>
  );
}
