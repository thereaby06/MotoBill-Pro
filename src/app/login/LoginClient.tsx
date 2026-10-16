"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button, Field } from "@/components/ui";
import { useWorkshop } from "@/lib/data/workshop-context";
import { DEMO_PASSWORD } from "@/lib/data/seed";

export default function LoginPage() {
  const { login, user, demoMode } = useWorkshop();
  const router = useRouter();
  const [email, setEmail] = useState(demoMode ? "admin@demo.motobill" : "");
  const [password, setPassword] = useState(demoMode ? DEMO_PASSWORD : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/app");
  }, [router, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const ok = await login(email, password);
    setBusy(false);
    if (!ok) {
      setError("No se pudo iniciar sesión. Revisa el correo y la contraseña.");
      return;
    }
    router.push("/app");
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form className="card-surface rim enter w-full max-w-md p-6" onSubmit={onSubmit}>
        <p className="text-sm font-bold tracking-widest text-cyan uppercase">MotoBill Pro</p>
        <h1 className="font-display mt-2 text-3xl font-black">Entrar al taller</h1>
        <div className="mt-6 grid gap-4">
          <Field label="Correo">
            <input className="input-surface" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Contraseña">
            <input
              className="input-surface"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error ? <p className="text-sm text-[#ff5c5c]">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Entrando…" : "Iniciar sesión"}
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted">
          ¿Nuevo taller?{" "}
          <Link className="text-accent" href="/registro">
            Crear cuenta
          </Link>
        </p>
      </form>
    </div>
  );
}
