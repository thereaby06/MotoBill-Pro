import { NextResponse } from "next/server";
import { isEmail } from "@/lib/format";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["admin", "mechanic", "cashier"];

type TeamPayload = {
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
  active?: boolean;
};

/**
 * Crea un usuario de Auth y su perfil en el taller del administrador que
 * consulta. Crear cuentas de Auth necesita la clave de servicio, por eso vive
 * en el servidor y nunca en el navegador.
 */
export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
  }

  const { data: authData } = await supabase.auth.getUser();
  const requester = authData.user;
  if (!requester) {
    return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", requester.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json(
      { error: "Solo un administrador puede crear usuarios." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as TeamPayload | null;
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  const fullName = (body.fullName ?? "").trim();
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  const role = (body.role ?? "cashier") as Role;
  const active = body.active ?? true;

  if (!fullName) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "El correo no es válido." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres." },
      { status: 400 },
    );
  }
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: "Rol no permitido." }, { status: 400 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "No se pudo crear la cuenta." },
      { status: 400 },
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    organization_id: profile.organization_id,
    full_name: fullName,
    email,
    role,
    active,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ id: created.user.id });
}
