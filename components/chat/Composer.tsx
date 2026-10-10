"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

interface ComposerProps {
  busy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  /** true mientras la persona escribe → el avatar pasa a "escuchando". */
  onListeningChange: (listening: boolean) => void;
  onFocusChange?: (focused: boolean) => void;
}

const MAX_CHARS = 4000;

export function Composer({ busy, onSend, onStop, onListeningChange, onFocusChange }: ComposerProps) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onListeningChange(focused && text.trim().length > 0);
  }, [focused, text, onListeningChange]);

  // Altura automática del campo (hasta 5 líneas aprox.).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (busy || !text.trim()) return;
    onSend(text);
    setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Con teclado físico: Enter envía, Mayús+Enter salta de línea.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form className="composer" onSubmit={submit}>
      <textarea
        ref={ref}
        className="composer__input"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
        onKeyDown={onKeyDown}
        onFocus={() => {
          setFocused(true);
          onFocusChange?.(true);
        }}
        onBlur={() => {
          setFocused(false);
          onFocusChange?.(false);
        }}
        placeholder="Mensaje"
        rows={1}
        enterKeyHint="send"
        autoComplete="off"
        aria-label="Mensaje"
      />
      {busy ? (
        <button type="button" className="composer__button" onClick={onStop} aria-label="Detener respuesta">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          </svg>
        </button>
      ) : (
        <button type="submit" className="composer__button" disabled={!text.trim()} aria-label="Enviar">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </form>
  );
}
