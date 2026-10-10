"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { ChatThread } from "@/components/chat/ChatThread";
import { Composer } from "@/components/chat/Composer";
import { StateDebugPanel } from "@/components/debug/StateDebugPanel";
import { useConversation } from "@/hooks/useConversation";

export default function Home() {
  const {
    messages,
    avatarState,
    busy,
    send,
    stop,
    reset,
    setListening,
    forceAvatarState,
  } = useConversation();

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    setDebug(
      new URLSearchParams(window.location.search).get("debug") === "1"
    );
  }, []);

  return (
    <main className={`app ${keyboardOpen ? "app--typing" : ""}`}>
      <header className="topbar">
        <div
          className="topbar__identity"
          style={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <span
            style={{
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#F5F1E9",
            }}
          >
            Sophie
          </span>
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.16em",
              color: "#C8A76A",
            }}
          >
            SOLEIL · AI COMPANION
          </span>
        </div>

        <button
          className="topbar__action"
          onClick={reset}
          disabled={messages.length === 0}
          aria-label="Nueva conversación"
          title="Nueva conversación"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 8,
          }}
        >
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </header>

      <section className="stage">
        <Avatar
          state={avatarState}
          compact={keyboardOpen && messages.length > 0}
        />
      </section>

      {debug && (
        <StateDebugPanel
          current={avatarState}
          onForce={forceAvatarState}
        />
      )}

      <ChatThread messages={messages} waiting={busy} />

      <Composer
        busy={busy}
        onSend={send}
        onStop={stop}
        onListeningChange={setListening}
        onFocusChange={setKeyboardOpen}
      />
    </main>
  );
}
