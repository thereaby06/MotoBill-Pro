/**
 * Genera un UUID v4. Los identificadores del dominio se usan también como clave
 * primaria en PostgreSQL, por eso deben ser UUID válidos tanto en modo demo
 * como al sincronizar con Supabase.
 */
export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = "0123456789abcdef";
  let out = "";
  for (let index = 0; index < 36; index += 1) {
    if (index === 8 || index === 13 || index === 18 || index === 23) {
      out += "-";
    } else if (index === 14) {
      out += "4";
    } else if (index === 19) {
      out += hex[((Math.random() * 4) | 0) + 8];
    } else {
      out += hex[(Math.random() * 16) | 0];
    }
  }
  return out;
}
