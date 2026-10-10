import { AVATAR_STATE_LABELS, type AvatarState } from "@/lib/avatar/states";

/**
 * MARCADOR PROVISIONAL. No es un personaje ni una propuesta de diseño:
 * es una forma abstracta que reacciona a los estados para poder probar
 * el sistema antes de tener las imágenes definitivas.
 * Desaparece automáticamente al configurar las imágenes en config/avatar.ts.
 */
export function AvatarPlaceholder({ state }: { state: AvatarState }) {
  return (
    <div className="placeholder" data-state={state}>
      <div className="placeholder__ring" />
      <div className="placeholder__core" />
      <span className="placeholder__label">{AVATAR_STATE_LABELS[state]}</span>
    </div>
  );
}
