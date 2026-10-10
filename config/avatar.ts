import type { AvatarState } from "@/lib/avatar/states";

/**
 * MANIFIESTO DEL AVATAR — aquí se conectan vuestras imágenes originales.
 *
 * 1. Copia los archivos en /public/avatar/ (PNG, WebP, AVIF, SVG, GIF o APNG).
 * 2. Asigna a cada estado su archivo. Formatos admitidos por estado:
 *      null                                  → se usa el marcador provisional
 *      "/avatar/neutral.png"                  → imagen fija (o WebP/APNG animado)
 *      { frames: ["/avatar/talk-1.png", "/avatar/talk-2.png"], fps: 8 }
 *                                            → secuencia de fotogramas en bucle
 * 3. Si un estado no tiene imagen, se muestra la de "neutral"; si tampoco hay
 *    neutral, el marcador provisional. Así puedes integrar las expresiones
 *    de una en una.
 *
 * Las imágenes se muestran tal cual (object-fit: contain): no se recortan,
 * no se recolorean ni se deforman.
 */

export type AvatarAsset = string | { frames: string[]; fps?: number } | null;

export interface AvatarConfig {
  states: Record<AvatarState, AvatarAsset>;
  /** Duración del fundido entre expresiones (ms). */
  transitionMs: number;
  /** Cuánto tiempo se mantiene la emoción tras una respuesta antes de volver a neutral (ms). */
  emotionHoldMs: number;
  /** Tiempo mínimo en "speaking" para que la expresión se perciba (ms). */
  minSpeakingMs: number;
  /** Proporción ancho/alto del lienzo del avatar, para que vuestro arte no se deforme. */
  aspectRatio: string;
}

export const avatarConfig: AvatarConfig = {
  states: {
    neutral: null, // p. ej. "/avatar/neutral.png"
    listening: null, // p. ej. "/avatar/listening.png"
    thinking: null, // p. ej. { frames: ["/avatar/thinking-1.png", "/avatar/thinking-2.png"], fps: 4 }
    speaking: null, // p. ej. { frames: ["/avatar/speaking-1.png", "/avatar/speaking-2.png"], fps: 8 }
    happy: null,
    sad: null,
    curious: null,
  },
  transitionMs: 250,
  emotionHoldMs: 4000,
  minSpeakingMs: 1200,
  aspectRatio: "1 / 1",
};

/** Nombre provisional que aparece en la barra superior. */
export const appConfig = {
  name: "SOLEIL",
};
