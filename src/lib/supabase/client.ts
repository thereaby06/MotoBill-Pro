import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./env";

export function createSupabaseBrowserClient() {
  const { url, anonKey, configured } = getSupabasePublicConfig();
  if (!configured) return null;
  return createBrowserClient(url, anonKey);
}
