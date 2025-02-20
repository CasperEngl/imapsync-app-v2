import type { StoreContext } from "~/renderer/store.js";

const STORAGE_KEY = "imapsync-store";

export function loadPersistedState(): Partial<StoreContext> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("[Store] Failed to load persisted state:", error);
  }

  return {};
}

export function persistState(state: StoreContext) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("[Store] Failed to persist state:", error);
  }
}

export function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("[Store] Failed to clear persisted state:", error);
  }
}
