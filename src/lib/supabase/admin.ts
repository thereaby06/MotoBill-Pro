import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de servidor con la clave de servicio. Solo debe usarse en Route
 * Handlers o código de servidor: nunca se expone al navegador.
 * Devuelve `null` cuando falta `SUPABASE_SERVICE_ROLE_KEY`.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
