"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { ChatThread } from "@/components/chat/ChatThread";
import { Composer } from "@/components/chat/Composer";
import { StateDebugPanel } from "@/components/debug/StateDebugPanel";
import { appConfig } from "@/config/avatar";
import { useConversation } from "@/hooks/useConversation";

export default function Home() {
  const { messages, avatarState, busy, send, stop, reset, setListening, forceAvatarState } = useConversation();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).get("debug") === "1");
  }, []);

  return (
    <main className={`app ${keyboardOpen ? "app--typing" : ""}`}>
      <header className="topbar">
        <span className="topbar__title">{appConfig.name}</span>
        <button
          className="topbar__action"
          onClick={reset}
          disabled={messages.length === 0}
          aria-label="Nueva conversación"
        >
          Nueva
        </button>
      </header>

      <section className="stage">
        <Avatar state={avatarState} compact={keyboardOpen && messages.length > 0} />
      </section>

      {debug && <StateDebugPanel current={avatarState} onForce={forceAvatarState} />}

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
