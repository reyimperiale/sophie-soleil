import type { Emotion } from "@/lib/avatar/states";

export type Role = "user" | "assistant";

/** Mensaje tal como se guarda en la interfaz durante la sesión. */
export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  /** Emoción que el modelo asignó a esta respuesta (solo asistente). */
  emotion?: Emotion;
  /** true si es un aviso de error generado por la app, no por el modelo. */
  error?: boolean;
}

/** Lo que el cliente envía al backend. */
export interface ChatRequestBody {
  messages: { role: Role; content: string }[];
  /** Reservado para la etapa de memoria persistente. */
  sessionId?: string;
}

/**
 * Eventos que el backend envía al cliente, uno por línea (NDJSON).
 * El mismo canal servirá para eventos de voz en la etapa 2 (p. ej. "audio", "viseme").
 */
export type StreamEvent =
  | { type: "emotion"; value: Emotion }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };
