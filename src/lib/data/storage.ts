import type { WorkshopSnapshot } from "../types";
import { DEFAULT_DASHBOARD_LAYOUT } from "../types";
import { createSeedSnapshot } from "./seed";

export const STORAGE_KEY = "motobill-pro-demo-v1";
export const LAYOUT_KEY = "motobill-pro-dashboard-layout";

export function loadSnapshot(): WorkshopSnapshot {
  if (typeof window === "undefined") return createSeedSnapshot();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedSnapshot();
    const parsed = JSON.parse(raw) as WorkshopSnapshot;
    if (!parsed.settings || !Array.isArray(parsed.users)) return createSeedSnapshot();
    return parsed;
  } catch {
    return createSeedSnapshot();
  }
}

export function saveSnapshot(snapshot: WorkshopSnapshot) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function resetSnapshot(): WorkshopSnapshot {
  const seed = createSeedSnapshot();
  saveSnapshot(seed);
  return seed;
}

/**
 * La distribución del panel es una preferencia de interfaz por dispositivo, así
 * que se guarda siempre en el navegador, incluso cuando el taller vive en
 * Supabase.
 */
export function loadLayout(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_DASHBOARD_LAYOUT];
  try {
    const raw = window.localStorage.getItem(LAYOUT_KEY);
    if (!raw) return [...DEFAULT_DASHBOARD_LAYOUT];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      return [...DEFAULT_DASHBOARD_LAYOUT];
    }
    return parsed as string[];
  } catch {
    return [...DEFAULT_DASHBOARD_LAYOUT];
  }
}

export function saveLayout(layout: string[]) {
  window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}
