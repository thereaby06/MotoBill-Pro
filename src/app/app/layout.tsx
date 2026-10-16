import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8 text-accent">Cargando panel…</div>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
