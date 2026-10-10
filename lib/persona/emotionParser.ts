import { EMOTIONS } from "@/lib/avatar/states";

/**
 * Protocolo técnico de emociones.
 *
 * Se añade SIEMPRE al final de las instrucciones de personalidad, para que quien
 * edite la personalidad no pueda romper por accidente el sistema de estados.
 * El servidor quita la etiqueta antes de que el texto llegue a la interfaz.
 */
export const EMOTION_TAG_PREFIX = "<<emotion:";
export const EMOTION_TAG_RE = /^<<emotion:\s*([a-zA-Z_-]+)\s*>>\s*/;

export function emotionProtocolInstruction(): string {
  return [
    "## Protocolo técnico (no forma parte de tu personalidad)",
    `Empieza CADA respuesta con exactamente una etiqueta con este formato: ${EMOTION_TAG_PREFIX}X>>`,
    `X debe ser una de estas palabras: ${EMOTIONS.join(", ")}.`,
    "Elige la que mejor refleje el tono emocional de tu respuesta.",
    "La etiqueta es invisible para la persona: nunca la menciones ni la expliques.",
    "Después de la etiqueta escribe tu respuesta normalmente.",
  ].join("\n");
}
