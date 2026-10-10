
import { isEmotion, type Emotion } from "@/lib/avatar/states";
import type { StreamEvent } from "@/lib/conversation/types";

const MAX_TAG_LENGTH = 80;
const EMOTION_TAG_RE =
  /^<<\s*(?:emotion\s*:\s*)?([a-zA-Z_-]+)\s*>>\s*/i;

function cleanEmotion(value: string): Emotion {
  const emotion = value.toLowerCase();
  return isEmotion(emotion) ? emotion : "neutral";
}

export function createEmotionTagParser() {
  let buffer = "";
  let resolved = false;

  const resolve = (emotion: Emotion, rest: string): StreamEvent[] => {
    resolved = true;
    buffer = "";

    const events: StreamEvent[] = [
      { type: "emotion", value: emotion },
    ];

    if (rest) {
      events.push({ type: "delta", text: rest });
    }

    return events;
  };

  return {
    push(text: string): StreamEvent[] {
      if (resolved) {
        return text ? [{ type: "delta", text }] : [];
      }

      buffer += text;
      const trimmed = buffer.trimStart();
      const match = trimmed.match(EMOTION_TAG_RE);

      if (match) {
        return resolve(
          cleanEmotion(match[1]),
          trimmed.slice(match[0].length)
        );
      }

      if (trimmed.length === 0) return [];

      if (
        trimmed.startsWith("<") &&
        !trimmed.includes(">>") &&
        trimmed.length < MAX_TAG_LENGTH
      ) {
        return [];
      }

      return resolve("neutral", buffer);
    },

    flush(): StreamEvent[] {
      if (resolved) return [];

      const trimmed = buffer.trimStart();
      const match = trimmed.match(EMOTION_TAG_RE);

      if (match) {
        return resolve(
          cleanEmotion(match[1]),
          trimmed.slice(match[0].length)
        );
      }

      return resolve("neutral", buffer);
    },
  };
}
