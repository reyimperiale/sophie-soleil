"use client";

import { useState } from "react";
import { AVATAR_STATES, AVATAR_STATE_LABELS, type AvatarState } from "@/lib/avatar/states";

/**
 * Panel para revisar las expresiones del avatar sin conversar.
 * Se activa abriendo la app con ?debug=1 en la URL.
 */
export function StateDebugPanel({
  current,
  onForce,
}: {
  current: AvatarState;
  onForce: (state: AvatarState | null) => void;
}) {
  const [forced, setForced] = useState<AvatarState | null>(null);

  const pick = (state: AvatarState | null) => {
    setForced(state);
    onForce(state);
  };

  return (
    <div className="debug" role="group" aria-label="Probar estados del avatar">
      <button className={`debug__chip ${forced === null ? "is-on" : ""}`} onClick={() => pick(null)}>
        Auto
      </button>
      {AVATAR_STATES.map((s) => (
        <button
          key={s}
          className={`debug__chip ${forced === s ? "is-on" : ""} ${forced === null && current === s ? "is-live" : ""}`}
          onClick={() => pick(s)}
        >
          {AVATAR_STATE_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
