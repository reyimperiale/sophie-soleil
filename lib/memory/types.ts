/**
 * ETAPA 2 — Memoria persistente (interfaz preparada, sin implementar).
 *
 * El backend ya llama a recall() antes de cada respuesta y a remember() al
 * terminarla. Hoy ambos no hacen nada. Para activar la memoria basta con
 * escribir una clase que implemente MemoryProvider (p. ej. con Postgres +
 * pgvector, Supabase, Redis o un vector store de OpenAI) y exportarla en
 * lib/memory/index.ts. No hay que tocar la interfaz ni el endpoint.
 */

export interface MemoryRecallInput {
  /** Identificador estable del usuario (llegará con la autenticación). */
  userId?: string;
  sessionId?: string;
  /** Último mensaje del usuario, útil para búsqueda semántica. */
  query: string;
}

export interface MemoryRememberInput {
  userId?: string;
  sessionId?: string;
  userMessage: string;
  assistantMessage: string;
}

export interface MemoryProvider {
  /** Devuelve contexto en texto para añadir a las instrucciones, o null. */
  recall(input: MemoryRecallInput): Promise<string | null>;
  /** Guarda lo que merezca recordarse de un intercambio. */
  remember(input: MemoryRememberInput): Promise<void>;
}
