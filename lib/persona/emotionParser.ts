import { isEmotion, type Emotion } from "@/lib/avatar/states";
import type { StreamEvent } from "@/lib/conversation/types";
import { EMOTION_TAG_PREFIX, EMOTION_TAG_RE } from "./protocol";

const MAX_TAG_LENGTH = 40;

/**
 * Lee el inicio del streaming del modelo, extrae la etiqueta <<emotion:X>>
 * y emite eventos limpios. Si el modelo no pone etiqueta, asume "neutral"
 * y deja pasar el texto sin perder nada.
 */
export function createEmotionTagParser() {
  let buffer = "";
  let resolved = false;

  const resolve = (emotion: Emotion, rest: string): StreamEvent[] => {
    resolved = true;
    buffer = "";
    const events: StreamEvent[] = [{ type: "emotion", value: emotion }];
    if (rest) events.push({ type: "delta", text: rest });
    return events;
  };

  return {
    push(text: string): StreamEvent[] {
      if (resolved) return text ? [{ type: "delta", text }] : [];

      buffer += text;
      const trimmed = buffer.trimStart();

      const match = trimmed.match(EMOTION_TAG_RE);
      if (match) {
        const raw = match[1].toLowerCase();
        return resolve(isEmotion(raw) ? raw : "neutral", trimmed.slice(match[0].length));
      }

      // ¿Puede seguir siendo una etiqueta a medio llegar?
      const couldBeTag =
        trimmed.length === 0 ||
        (trimmed.startsWith(EMOTION_TAG_PREFIX)
          ? !trimmed.includes(">>") && trimmed.length < MAX_TAG_LENGTH
          : EMOTION_TAG_PREFIX.startsWith(trimmed));
      if (couldBeTag) return [];

      // No hay etiqueta: se entrega el texto tal cual.
      return resolve("neutral", buffer);
    },

    flush(): StreamEvent[] {
      if (resolved) return [];
      const trimmed = buffer.trim();
      const match = trimmed.match(EMOTION_TAG_RE);
      if (match) {
        const raw = match[1].toLowerCase();
        return resolve(isEmotion(raw) ? raw : "neutral", trimmed.slice(match[0].length));
      }
      return resolve("neutral", trimmed);
    },
  };
}
