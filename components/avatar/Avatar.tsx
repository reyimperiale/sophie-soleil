"use client";

import { useEffect, useMemo, useState } from "react";
import { avatarConfig, type AvatarAsset } from "@/config/avatar";
import { AVATAR_STATES, AVATAR_STATE_LABELS, type AvatarState } from "@/lib/avatar/states";
import { AvatarPlaceholder } from "./AvatarPlaceholder";

interface AvatarProps {
  state: AvatarState;
  /** Versión compacta cuando el teclado está abierto. */
  compact?: boolean;
}

function framesOf(asset: AvatarAsset): { frames: string[]; fps: number } | null {
  if (!asset) return null;
  if (typeof asset === "string") return { frames: [asset], fps: 0 };
  if (!asset.frames.length) return null;
  return { frames: asset.frames, fps: asset.fps ?? 8 };
}

/**
 * Muestra la expresión correspondiente al estado actual.
 *
 * Todas las expresiones configuradas se cargan a la vez y se apilan; solo la
 * activa es visible. Así el cambio de expresión es instantáneo (sin parpadeos
 * de carga) y se hace con un fundido suave.
 */
export function Avatar({ state, compact = false }: AvatarProps) {
  const [missing, setMissing] = useState<Partial<Record<AvatarState, boolean>>>({});

  const available = useMemo(
    () => AVATAR_STATES.filter((s) => framesOf(avatarConfig.states[s]) && !missing[s]),
    [missing],
  );

  // Estado → su imagen; si no existe, la de neutral; si tampoco, marcador provisional.
  const visible: AvatarState | null = available.includes(state)
    ? state
    : available.includes("neutral")
      ? "neutral"
      : null;

  return (
    <div
      className={`avatar ${compact ? "avatar--compact" : ""}`}
      data-state={state}
      style={{ aspectRatio: avatarConfig.aspectRatio }}
      role="img"
      aria-label={`Avatar: ${AVATAR_STATE_LABELS[state]}`}
      aria-live="polite"
    >
      {available.map((s) => (
        <AvatarLayer
          key={s}
          asset={framesOf(avatarConfig.states[s])!}
          active={s === visible}
          onMissing={() => {
            console.warn(`[avatar] No se pudo cargar la imagen del estado "${s}".`);
            setMissing((prev) => ({ ...prev, [s]: true }));
          }}
        />
      ))}
      {visible === null && <AvatarPlaceholder state={state} />}
    </div>
  );
}

function AvatarLayer({
  asset,
  active,
  onMissing,
}: {
  asset: { frames: string[]; fps: number };
  active: boolean;
  onMissing: () => void;
}) {
  const [index, setIndex] = useState(0);
  const animated = asset.frames.length > 1 && asset.fps > 0;

  // Precarga de todos los fotogramas.
  useEffect(() => {
    asset.frames.slice(1).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [asset.frames]);

  // Animación por fotogramas solo mientras la capa está activa.
  useEffect(() => {
    if (!animated || !active) {
      setIndex(0);
      return;
    }
    const id = setInterval(() => setIndex((i) => (i + 1) % asset.frames.length), 1000 / asset.fps);
    return () => clearInterval(id);
  }, [animated, active, asset.frames.length, asset.fps]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="avatar__layer"
      src={asset.frames[index]}
      alt=""
      draggable={false}
      decoding="async"
      onError={onMissing}
      style={{ opacity: active ? 1 : 0, transitionDuration: `${avatarConfig.transitionMs}ms` }}
    />
  );
}
