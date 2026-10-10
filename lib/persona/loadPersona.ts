import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Carga la personalidad desde /persona. SOLO SERVIDOR.
 *
 *   persona/<id>.md             → instrucciones de personalidad (texto libre)
 *   persona/<id>.settings.json  → parámetros del modelo para esa personalidad
 *
 * En desarrollo se relee en cada petición: puedes editar la personalidad
 * y probarla sin reiniciar. En producción se guarda en caché.
 */

export interface PersonaSettings {
  /** Modelo de OpenAI. La variable OPENAI_MODEL tiene prioridad. */
  model?: string;
  /** null = no enviar temperatura (necesario para modelos de razonamiento). */
  temperature?: number | null;
  /** Límite de tokens por respuesta. null = sin límite explícito. */
  maxOutputTokens?: number | null;
  /** Cuántos mensajes recientes del historial se envían al modelo. */
  maxHistoryMessages: number;
}

export interface Persona {
  id: string;
  instructions: string;
  settings: PersonaSettings;
}

const DEFAULT_SETTINGS: PersonaSettings = {
  temperature: 0.8,
  maxOutputTokens: 600,
  maxHistoryMessages: 30,
};

const cache = new Map<string, Persona>();

export async function loadPersona(id = process.env.PERSONA_ID || "soleil"): Promise<Persona> {
  if (!/^[a-z0-9_-]+$/i.test(id)) throw new Error(`PERSONA_ID no válido: ${id}`);

  const useCache = process.env.NODE_ENV === "production";
  const cached = useCache ? cache.get(id) : undefined;
  if (cached) return cached;

  const dir = path.join(process.cwd(), "persona");
  const instructions = (await readFile(path.join(dir, `${id}.md`), "utf8")).trim();

  let settings = { ...DEFAULT_SETTINGS };
  try {
    const raw = await readFile(path.join(dir, `${id}.settings.json`), "utf8");
    settings = { ...settings, ...(JSON.parse(raw) as Partial<PersonaSettings>) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  const persona: Persona = { id, instructions, settings };
  if (useCache) cache.set(id, persona);
  return persona;
}
