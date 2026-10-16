import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/**
 * En Next.js 16 el antiguo `middleware` se llama `proxy`.
 * Aquí solo se refresca la sesión de Supabase para que las cookies viajen
 * actualizadas al servidor. Sin variables configuradas no hace nada.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, anonKey, configured } = getSupabasePublicConfig();
  if (!configured) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Obliga a refrescar el token cuando expiró.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
