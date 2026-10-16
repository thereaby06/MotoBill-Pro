import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "MotoBill Pro · Gestión para talleres de motos",
};

export const instant = false;

export default function LandingPage() {
  const demo = !isSupabaseConfigured();
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(0,229,255,0.12),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(255,109,0,0.12),transparent_26%),#0d0d0d]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-display text-xl font-black text-accent">MotoBill Pro</p>
        <div className="flex gap-3">
          <Link className="btn btn-ghost" href="/login">
            Entrar
          </Link>
          <Link className="btn btn-primary" href="/registro">
            {demo ? "Crear taller demo" : "Crear taller"}
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="enter">
          <p className="mb-3 text-sm font-bold tracking-[0.2em] text-cyan uppercase">
            Tech-Mechanic
          </p>
          <h1 className="font-display max-w-xl text-5xl font-black leading-tight sm:text-6xl">
            Controla el taller, no el papel.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Facturación, órdenes de servicio, inventario y agenda en una sola pantalla,
            pensada para dueños, mecánicos y recepcionistas de talleres de motos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/login">
              {demo ? "Abrir demostración" : "Iniciar sesión"}
            </Link>
            <Link className="btn btn-accent" href="/registro">
              Registrar taller
            </Link>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-[#d7d7d7] sm:grid-cols-2">
            {[
              "Clientes y motos con historial",
              "OT con firma digital",
              "Alertas de stock mínimo",
              "Cotización a factura en un clic",
            ].map((item) => (
              <li key={item} className="rounded-xl border border-line bg-[#141414] px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </section>
        <aside className="card-surface rim enter p-6">
          {demo ? (
            <>
              <p className="text-sm text-muted">Accesos de demostración</p>
              <div className="mt-4 grid gap-3 text-sm">
                <p>
                  <strong className="text-cta">Administrador:</strong> admin@demo.motobill
                </p>
                <p>
                  <strong className="text-cta">Mecánico:</strong> mecanico@demo.motobill
                </p>
                <p>
                  <strong className="text-cta">Cajero:</strong> cajero@demo.motobill
                </p>
                <p>
                  Contraseña común: <code className="text-accent">demo1234</code>
                </p>
              </div>
              <p className="mt-6 text-xs text-muted">
                Los datos de ejemplo están marcados como demostración. No representan un taller
                real.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">Cómo empezar</p>
              <div className="mt-4 grid gap-3 text-sm">
                <p>1. Crea tu taller con el botón «Crear taller».</p>
                <p>2. Confirma tu correo si Supabase pide verificación.</p>
                <p>3. Inicia sesión y carga clientes, motos y órdenes.</p>
                <p>4. Suma a tu equipo desde la sección Usuarios.</p>
              </div>
              <p className="mt-6 text-xs text-muted">
                Los datos de cada taller quedan aislados en su propia organización.
              </p>
            </>
          )}
        </aside>
      </main>
    </div>
  );
}
