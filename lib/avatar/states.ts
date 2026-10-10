/**
 * Estados del avatar.
 *
 * - Estados de interacción (los decide la interfaz): neutral, listening, thinking, speaking.
 * - Estados emocionales (los decide el modelo en cada respuesta): neutral, happy, sad, curious.
 *
 * Para añadir un estado nuevo: agrégalo aquí, añade su imagen en config/avatar.ts
 * y, si es emocional, inclúyelo también en EMOTIONS.
 */
export const AVATAR_STATES = [
  "neutral",
  "listening",
  "thinking",
  "speaking",
  "happy",
  "sad",
  "curious",
] as const;

export type AvatarState = (typeof AVATAR_STATES)[number];

/** Subconjunto que el modelo puede elegir al final de cada respuesta. */
export const EMOTIONS = ["neutral", "happy", "sad", "curious"] as const satisfies readonly AvatarState[];

export type Emotion = (typeof EMOTIONS)[number];

export function isEmotion(value: string): value is Emotion {
  return (EMOTIONS as readonly string[]).includes(value);
}

export function isAvatarState(value: string): value is AvatarState {
  return (AVATAR_STATES as readonly string[]).includes(value);
}

/** Etiquetas legibles (solo para accesibilidad y el panel de depuración). */
export const AVATAR_STATE_LABELS: Record<AvatarState, string> = {
  neutral: "Neutral",
  listening: "Escuchando",
  thinking: "Pensando",
  speaking: "Hablando",
  happy: "Feliz",
  sad: "Triste",
  curious: "Curioso",
};
