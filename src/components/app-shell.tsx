"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useWorkshop } from "@/lib/data/workshop-context";
import { ROLE_LABEL, type Permission } from "@/lib/permissions";

const NAV: { href: string; label: string; permission: Permission }[] = [
  { href: "/app", label: "Dashboard", permission: "dashboard" },
  { href: "/app/clientes", label: "Clientes", permission: "customers" },
  { href: "/app/motos", label: "Motos", permission: "motorcycles" },
  { href: "/app/ordenes", label: "Órdenes", permission: "work_orders" },
  { href: "/app/inventario", label: "Inventario", permission: "inventory_read" },
  { href: "/app/cotizaciones", label: "Cotizaciones", permission: "quotes" },
  { href: "/app/facturas", label: "Facturas", permission: "invoices" },
  { href: "/app/agenda", label: "Agenda", permission: "appointments" },
  { href: "/app/reportes", label: "Reportes", permission: "reports" },
  { href: "/app/usuarios", label: "Usuarios", permission: "users" },
  { href: "/app/configuracion", label: "Configuración", permission: "settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, snapshot, logout, demoMode, toast, allowed } = useWorkshop();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [router, user]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const customers = snapshot.customers
      .filter((item) => item.name.toLowerCase().includes(q) || item.phone.includes(q))
      .map((item) => ({ href: `/app/clientes/${item.id}`, label: `Cliente · ${item.name}` }));
    const motos = snapshot.motorcycles
      .filter((item) => item.plate.toLowerCase().includes(q) || item.model.toLowerCase().includes(q))
      .map((item) => ({ href: `/app/motos/${item.id}`, label: `Moto · ${item.plate}` }));
    const orders = snapshot.workOrders
      .filter((item) => item.number.toLowerCase().includes(q))
      .map((item) => ({ href: `/app/ordenes/${item.id}`, label: `OT · ${item.number}` }));
    return [...customers, ...motos, ...orders].slice(0, 8);
  }, [query, snapshot]);

  if (!user) return null;
  const items = NAV.filter((item) => allowed(item.permission));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,212,170,0.08),_transparent_28%),linear-gradient(#0d0d0d,#111)]">
      <div className="flex min-h-screen">
        <aside
          className={`${collapsed ? "w-[76px]" : "w-[250px]"} hidden border-r border-line bg-[#101010] md:flex md:flex-col`}
        >
          <div className="flex items-center justify-between px-4 py-5">
            <Link href="/app" className="font-display text-lg font-black text-accent">
              {collapsed ? "MB" : "MotoBill Pro"}
            </Link>
            <button
              className="btn btn-ghost px-2 py-1 text-xs"
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label="Colapsar menú"
            >
              {collapsed ? ">" : "<"}
            </button>
          </div>
          <nav className="grid gap-1 px-3">
            {items.map((item) => {
              const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-[#1c1c1c] text-cyan rim" : "text-[#c5c5c5] hover:bg-[#181818]"
                  }`}
                >
                  {collapsed ? item.label.slice(0, 2) : item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-[#0d0d0d]/90 px-4 py-3 backdrop-blur">
            <button
              className="btn btn-ghost md:hidden"
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
            >
              Menú
            </button>
            <div className="relative min-w-0 flex-1">
              <input
                className="input-surface"
                placeholder="Buscar cliente, placa u OT"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Búsqueda global"
              />
              {results.length > 0 ? (
                <div className="absolute mt-1 w-full overflow-hidden rounded-xl border border-line bg-[#151515]">
                  {results.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-sm hover:bg-[#1d1d1d]"
                      onClick={() => setQuery("")}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{user.fullName}</p>
              <p className="text-xs text-muted">{ROLE_LABEL[user.role]}</p>
            </div>
            <button className="btn btn-ghost" type="button" onClick={logout}>
              Salir
            </button>
          </header>
          {mobileOpen ? (
            <div className="grid gap-1 border-b border-line bg-[#101010] p-3 md:hidden">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
          {demoMode ? (
            <div className="bg-[#1a1608] px-4 py-2 text-sm text-cta">
              Modo demostración: los datos se guardan en este navegador. Conecta Supabase para
              autenticación y persistencia compartida.
            </div>
          ) : null}
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
      {toast ? (
        <div
          className={`fixed right-4 bottom-4 z-50 rounded-xl px-4 py-3 font-semibold ${
            toast.kind === "ok" ? "bg-accent text-[#06281f]" : "bg-[#ff5c5c] text-white"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
