/**
 * ETAPA 2 — Conversación por voz (interfaz preparada, sin implementar).
 *
 * Cómo encaja con lo que ya existe:
 * - SpeechInput.onFinal(text) → llama a conversation.send(text), igual que el teclado.
 * - Mientras SpeechInput escucha → conversation.setListening(true): el avatar ya
 *   tiene el estado "listening".
 * - SpeechOutput.speak() → mientras suena el audio, el avatar está en "speaking";
 *   al terminar, muestra la emoción de la respuesta (ver hooks/useConversation.ts).
 * - onViseme permitirá sincronizar la boca del avatar si vuestro diseño lo incluye.
 *
 * Opciones previsibles: OpenAI Realtime API (voz a voz por WebRTC), o
 * transcripción (gpt-4o-transcribe / Whisper) + síntesis (TTS) por separado,
 * ambas a través de rutas de servidor para no exponer la API key.
 */

export interface SpeechInput {
  start(): Promise<void>;
  stop(): Promise<void>;
  onPartial?(callback: (text: string) => void): void;
  onFinal(callback: (text: string) => void): void;
}

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  /** Para sincronización labial, si el diseño del avatar la contempla. */
  onViseme?: (viseme: string, timeMs: number) => void;
}

export interface SpeechOutput {
  speak(text: string, options?: SpeakOptions): Promise<void>;
  cancel(): void;
}
