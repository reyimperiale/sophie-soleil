/**
 * Límite de peticiones en memoria, por IP (ventana deslizante de 60 s).
 *
 * Suficiente para pruebas y un solo servidor. En producción con varias
 * instancias (p. ej. Vercel), sustitúyelo por un almacén compartido
 * como Upstash Redis o el firewall de la plataforma.
 */
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function checkRateLimit(key: string): boolean {
  const limit = Number(process.env.RATE_LIMIT_PER_MINUTE) || 20;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  // Limpieza ocasional para que el mapa no crezca sin fin.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return true;
}
