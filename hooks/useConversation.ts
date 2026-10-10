"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { avatarConfig } from "@/config/avatar";
import type { AvatarState, Emotion } from "@/lib/avatar/states";
import type { ChatMessage, StreamEvent } from "@/lib/conversation/types";

const STORAGE_KEY = "soleil.session.v1";
const SESSION_ID_KEY = "soleil.sessionId.v1";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Corazón de la app: historial de la sesión + máquina de estados del avatar.
 *
 *   escribiendo                → listening
 *   mensaje enviado            → thinking
 *   llega el primer texto      → speaking
 *   respuesta completa         → emoción elegida por el modelo (happy/sad/curious/neutral)
 *   tras emotionHoldMs         → neutral (o listening si la persona está escribiendo)
 *
 * La entrada por voz de la etapa 2 usará las mismas funciones: send() y setListening().
 */
export function useConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [avatarState, setAvatarState] = useState<AvatarState>("neutral");
  const [busy, setBusy] = useState(false);

  const messagesRef = useRef<ChatMessage[]>([]);
  const busyRef = useRef(false);
  const listeningRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>("");
  const forcedRef = useRef(false);

  // ---- Persistencia durante la sesión (sobrevive a recargas, no a cerrar la pestaña) ----
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw) as ChatMessage[]);
      sessionIdRef.current = sessionStorage.getItem(SESSION_ID_KEY) || uid();
      sessionStorage.setItem(SESSION_ID_KEY, sessionIdRef.current);
    } catch {
      sessionIdRef.current = uid();
    }
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* almacenamiento no disponible: el historial sigue en memoria */
    }
  }, [messages]);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
  }, []);

  // ---- Estados ----
  const restingState = (): AvatarState => (listeningRef.current ? "listening" : "neutral");

  const clearHold = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  };

  const applyState = useCallback((state: AvatarState) => {
    if (!forcedRef.current) setAvatarState(state);
  }, []);

  const showEmotion = useCallback(
    (emotion: Emotion) => {
      clearHold();
      if (emotion === "neutral") {
        applyState(restingState());
        return;
      }
      applyState(emotion);
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        if (!busyRef.current) applyState(restingState());
      }, avatarConfig.emotionHoldMs);
    },
    [applyState],
  );

  /** La persona está escribiendo (o, en la etapa 2, hablando). */
  const setListening = useCallback(
    (listening: boolean) => {
      if (listeningRef.current === listening) return;
      listeningRef.current = listening;
      if (busyRef.current) return;
      if (listening) {
        clearHold(); // escribir interrumpe la emoción mostrada
        applyState("listening");
      } else if (!holdTimerRef.current) {
        applyState("neutral");
      }
    },
    [applyState],
  );

  // ---- Envío ----
  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || busyRef.current) return;

      clearHold();
      busyRef.current = true;
      setBusy(true);
      listeningRef.current = false;

      const userMessage: ChatMessage = { id: uid(), role: "user", content: text, createdAt: Date.now() };
      const assistantId = uid();
      const history = [...messagesRef.current, userMessage]
        .filter((m) => !m.error && m.content.trim())
        .map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [...prev, userMessage]);
      applyState("thinking");

      const controller = new AbortController();
      abortRef.current = controller;

      let emotion: Emotion = "neutral";
      let started = false;
      let speakingSince = 0;

      const handle = (event: StreamEvent) => {
        switch (event.type) {
          case "emotion":
            emotion = event.value;
            break;
          case "delta":
            if (!started) {
              started = true;
              speakingSince = Date.now();
              applyState("speaking");
              setMessages((prev) => [
                ...prev,
                { id: assistantId, role: "assistant", content: event.text, createdAt: Date.now() },
              ]);
            } else {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + event.text } : m)),
              );
            }
            break;
          case "error":
            throw new Error(event.message);
          case "done":
            break;
        }
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, sessionId: sessionIdRef.current }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? `Error del servidor (${res.status}).`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let newline: number;
          while ((newline = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (line) handle(JSON.parse(line) as StreamEvent);
          }
        }
        if (buffer.trim()) handle(JSON.parse(buffer) as StreamEvent);

        if (!started) throw new Error("La respuesta llegó vacía.");

        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, emotion } : m)));

        // Deja que la expresión "hablando" se perciba aunque el texto llegue muy rápido.
        const remaining = avatarConfig.minSpeakingMs - (Date.now() - speakingSince);
        if (remaining > 0) await wait(remaining);

        busyRef.current = false;
        showEmotion(emotion);
      } catch (err) {
        busyRef.current = false;
        if (controller.signal.aborted) {
          applyState(restingState());
        } else {
          const message = err instanceof Error ? err.message : "Algo salió mal.";
          setMessages((prev) => [
            ...prev,
            { id: uid(), role: "assistant", content: message, createdAt: Date.now(), error: true },
          ]);
          applyState("neutral");
        }
      } finally {
        busyRef.current = false;
        abortRef.current = null;
        setBusy(false);
      }
    },
    [applyState, showEmotion],
  );

  /** Detiene la respuesta en curso. */
  const stop = useCallback(() => abortRef.current?.abort(), []);

  /** Empieza una conversación nueva (borra el historial de la sesión). */
  const reset = useCallback(() => {
    abortRef.current?.abort();
    clearHold();
    setMessages([]);
    sessionIdRef.current = uid();
    try {
      sessionStorage.setItem(SESSION_ID_KEY, sessionIdRef.current);
    } catch {
      /* ignorar */
    }
    applyState(restingState());
  }, [applyState]);

  /** Solo para el panel de depuración: fija un estado manualmente (null = automático). */
  const forceAvatarState = useCallback((state: AvatarState | null) => {
    forcedRef.current = state !== null;
    setAvatarState(state ?? (busyRef.current ? "thinking" : restingState()));
  }, []);

  return { messages, avatarState, busy, send, stop, reset, setListening, forceAvatarState };
}
