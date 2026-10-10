# SOLEIL — base funcional

AI companion conversacional para iPhone. Next.js 15 (App Router) + React 19 + TypeScript.
Conversación real con OpenAI en streaming, personalidad editable fuera del código,
sistema de estados del avatar y espacio preparado para vuestras imágenes originales.

---

## 1. Puesta en marcha

**Requisitos:** Node.js 20 o superior y una API key de OpenAI con facturación activa
(platform.openai.com → API keys).

```bash
npm install
cp .env.example .env.local      # y pega tu clave en OPENAI_API_KEY
npm run dev
```

Abre http://localhost:3000. Para verlo en un iPhone usa el modo responsive del
navegador o, mejor, el teléfono real (siguiente apartado).

### Probar en el iPhone (misma red wifi)

```bash
npm run dev:iphone
```

En el iPhone abre `http://IP-DE-TU-ORDENADOR:3000` en Safari
(la IP sale en Ajustes de red del ordenador, p. ej. `192.168.1.20`).
Opcional: Compartir → **Añadir a pantalla de inicio** para abrirla a pantalla completa.

### Producción

```bash
npm run build && npm start
```

O despliega en Vercel: importa el repositorio y añade `OPENAI_API_KEY`
(y opcionalmente `OPENAI_MODEL`) en *Settings → Environment Variables*.

### Variables de entorno

| Variable                | Obligatoria | Uso |
|-------------------------|-------------|-----|
| `OPENAI_API_KEY`        | Sí          | Clave de OpenAI. Solo se usa en el servidor. |
| `OPENAI_MODEL`          | No          | Modelo (por defecto `gpt-4o-mini`). |
| `PERSONA_ID`            | No          | Qué personalidad cargar de `persona/` (por defecto `soleil`). |
| `RATE_LIMIT_PER_MINUTE` | No          | Mensajes por minuto y por IP (por defecto 20). |

---

## 2. Estructura

```
app/
  api/chat/route.ts        Backend: llama a OpenAI, extrae la emoción, responde en streaming
  page.tsx                 Pantalla única (avatar + conversación + campo de texto)
  layout.tsx               Metadatos de iPhone (pantalla completa, safe areas, sin zoom)
  theme.css                TOKENS VISUALES: colores, tipografía, medidas
  globals.css              Maquetación
config/
  avatar.ts                MANIFIESTO DEL AVATAR: imagen de cada estado + tiempos
persona/
  soleil.md                PERSONALIDAD (texto libre, editable sin tocar código)
  soleil.settings.json     Temperatura, longitud de respuesta, historial enviado
components/
  avatar/Avatar.tsx        Muestra vuestras imágenes según el estado
  avatar/AvatarPlaceholder Marcador abstracto provisional (se va solo al poner imágenes)
  chat/ChatThread.tsx      Historial
  chat/Composer.tsx        Campo de texto
  debug/StateDebugPanel    Botones para probar expresiones (?debug=1)
hooks/
  useConversation.ts       Historial de sesión + máquina de estados del avatar
lib/
  avatar/states.ts         Lista de estados
  persona/                 Carga de personalidad y protocolo de emociones
  memory/                  ETAPA 2: interfaz de memoria persistente (vacía)
  voice/                   ETAPA 2: interfaz de voz (vacía)
  server/rateLimit.ts      Límite de peticiones
public/avatar/             Aquí van vuestras imágenes
```

---

## 3. Cómo funciona la conversación

1. El navegador envía el historial de la sesión a `/api/chat`.
2. El servidor combina: personalidad (`persona/soleil.md`) + protocolo de emociones
   + historial reciente, y llama a OpenAI con streaming.
3. El modelo empieza cada respuesta con una etiqueta oculta, p. ej. `<<emotion:happy>>`.
   El servidor la retira y envía al navegador eventos separados:
   ```
   {"type":"emotion","value":"happy"}
   {"type":"delta","text":"¡Hola! "}
   {"type":"done"}
   ```
4. La API key nunca sale del servidor. El endpoint valida el contenido,
   solo acepta peticiones de la propia web y limita los mensajes por minuto.

## 4. Estados del avatar

| Estado      | Cuándo ocurre |
|-------------|---------------|
| `neutral`   | En reposo. |
| `listening` | La persona está escribiendo (en la etapa 2, hablando). |
| `thinking`  | Mensaje enviado, esperando la respuesta. |
| `speaking`  | Llega el texto de la respuesta (mínimo `minSpeakingMs`). |
| `happy` / `sad` / `curious` | Al terminar la respuesta, según la emoción que eligió el modelo. Se mantiene `emotionHoldMs` y vuelve a neutral. |

Para revisar todas las expresiones sin conversar, abre la app con **`?debug=1`**
(p. ej. `http://localhost:3000/?debug=1`).

## 5. Integrar vuestro avatar

1. Copia las imágenes en `public/avatar/` (ver `public/avatar/LEEME.md`).
2. En `config/avatar.ts`, asigna cada estado:
   ```ts
   neutral: "/avatar/neutral.png",
   speaking: { frames: ["/avatar/speaking-1.png", "/avatar/speaking-2.png"], fps: 8 },
   ```
   Admite imagen fija, WebP/APNG/GIF animado o secuencia de fotogramas.
3. Las imágenes se muestran sin recortar ni alterar (`object-fit: contain`).
   Si un estado aún no tiene imagen, se usa la de `neutral`.
4. Colores, tipografía y medidas de la interfaz están en `app/theme.css`.

Si más adelante el avatar pasa a ser animación vectorial (Rive, Lottie) o vídeo,
solo hay que sustituir `components/avatar/Avatar.tsx`: el resto de la app solo
le pasa la prop `state`.

## 6. Editar la personalidad

Edita `persona/soleil.md`. En desarrollo el cambio se aplica en el siguiente mensaje.
Puedes tener varias (`persona/otra.md`) y elegir con `PERSONA_ID`.

En `persona/soleil.settings.json`:
- `temperature`: creatividad (0–2). Pon `null` si usas un modelo de razonamiento
  que no admite temperatura.
- `maxOutputTokens`: longitud máxima de cada respuesta.
- `maxHistoryMessages`: cuántos mensajes recientes recuerda el modelo en la sesión.

## 7. Etapa 2 (preparado, no implementado)

- **Memoria persistente:** `lib/memory/`. El endpoint ya llama a `memory.recall()`
  antes de responder y a `memory.remember()` al terminar; hoy no hacen nada.
  Implementa `MemoryProvider` (Postgres + pgvector, Supabase, etc.) y expórtalo
  en `lib/memory/index.ts`. Hará falta además identificar al usuario (login).
- **Voz:** `lib/voice/types.ts` define entrada y salida de voz. Se conectan a las
  funciones existentes `send()` y `setListening()` de `useConversation`, de modo
  que los estados `listening` y `speaking` funcionarán igual.

## 8. Notas

- El historial se guarda solo durante la sesión (`sessionStorage`): sobrevive a
  recargar la página y se borra al cerrar la pestaña o pulsar **Nueva**.
- El límite de peticiones es en memoria; con varias instancias en producción
  conviene sustituirlo por Upstash Redis o el firewall de la plataforma.
- La interfaz está pensada solo para iPhone en vertical; en un ordenador se ve
  como una columna centrada, sin versión de escritorio.
