"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/conversation/types";

interface ChatThreadProps {
  messages: ChatMessage[];
  /** Muestra el indicador de "pensando" mientras no ha llegado texto. */
  waiting: boolean;
}

export function ChatThread({ messages, waiting }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const last = messages[messages.length - 1];
  const showTyping = waiting && last?.role === "user";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, showTyping]);

  return (
    <section className="thread" aria-live="polite" aria-label="Conversación">
      {messages.length === 0 && <p className="thread__empty">Escribe algo para empezar.</p>}

      {messages.map((m) => (
        <div
          key={m.id}
          className={`bubble bubble--${m.role}${m.error ? " bubble--error" : ""}`}
          data-emotion={m.emotion}
        >
          {m.content}
        </div>
      ))}

      {showTyping && (
        <div className="bubble bubble--assistant bubble--typing" aria-label="Pensando">
          <span />
          <span />
          <span />
        </div>
      )}
      <div ref={endRef} />
    </section>
  );
}
