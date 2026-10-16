"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button, Field } from "@/components/ui";
import { useWorkshop } from "@/lib/data/workshop-context";
import { isEmail } from "@/lib/format";

export default function RegisterPage() {
  const { register, user, demoMode } = useWorkshop();
  const router = useRouter();
  const [workshopName, setWorkshopName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/app");
  }, [router, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!isEmail(email)) {
      setError("Ingresa un correo válido.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setBusy(true);
    const ok = await register({ workshopName, fullName, email, password });
    setBusy(false);
    if (!ok) return;
    router.push("/app");
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form className="card-surface rim enter w-full max-w-md p-6" onSubmit={onSubmit}>
        <h1 className="font-display text-3xl font-black">Registrar taller</h1>
        <p className="mt-2 text-sm text-muted">
          {demoMode
            ? "Supabase no está configurado: el taller se guarda en este navegador."
            : "El registro crea tu cuenta en Supabase Auth y tu taller con la función register_workshop. Si la confirmación por correo está activa, confirma tu cuenta antes de entrar."}
        </p>
        <div className="mt-6 grid gap-4">
          <Field label="Nombre del taller">
            <input className="input-surface" value={workshopName} onChange={(e) => setWorkshopName(e.target.value)} required />
          </Field>
          <Field label="Responsable">
            <input className="input-surface" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          <Field label="Correo">
            <input className="input-surface" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Contraseña">
            <input className="input-surface" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error ? <p className="text-sm text-[#ff5c5c]">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Creando…" : "Crear taller"}
          </Button>
        </div>
        <Link className="mt-4 inline-block text-sm text-accent" href="/login">
          Ya tengo acceso
        </Link>
      </form>
    </div>
  );
}
