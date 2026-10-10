import type { MemoryProvider } from "./types";

/** Implementación vacía: la app solo recuerda la sesión actual (en el cliente). */
class NoopMemoryProvider implements MemoryProvider {
  async recall(): Promise<string | null> {
    return null;
  }
  async remember(): Promise<void> {}
}

/** Sustituye esta instancia por tu proveedor real en la etapa 2. */
export const memory: MemoryProvider = new NoopMemoryProvider();

export type { MemoryProvider } from "./types";
