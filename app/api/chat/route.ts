import OpenAI from "openai";
import type {
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import type { NextRequest } from "next/server";

import { loadPersona } from "@/lib/persona/loadPersona";
import { emotionProtocolInstruction } from "@/lib/persona/protocol";
import { createEmotionTagParser } from "@/lib/persona/emotionParser";
import { memory } from "@/lib/memory";
import { checkRateLimit } from "@/lib/server/rateLimit";
import type { ChatRequestBody, Role, StreamEvent } from "@/lib/conversation/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_MESSAGE_CHARS = 4000;
const MAX_MESSAGES_IN_REQUEST = 200;

function errorResponse(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

/** Valida estrictamente lo que llega del navegador. */
function parseBody(body: unknown): ChatRequestBody | null {
  if (!body || typeof body !== "object") return null;
  const { messages, sessionId } = body as Record<string, unknown>;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (messages.length > MAX_MESSAGES_IN_REQUEST) return null;

  const clean: ChatRequestBody["messages"] = [];
  for (const m of messages) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const text = content.trim();
    if (!text || text.length > MAX_MESSAGE_CHARS) return null;
    clean.push({ role: role as Role, content: text });
  }
  if (clean[clean.length - 1].role !== "user") return null;

  return {
    messages: clean,
    sessionId: typeof sessionId === "string" ? sessionId.slice(0, 100) : undefined,
  };
}

function describeOpenAIError(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 401) return "La API key de OpenAI no es válida.";
    if (err.status === 429) return "OpenAI rechazó la petición por límite de uso o falta de saldo.";
    if (err.status === 404) return "El modelo configurado no existe o tu cuenta no tiene acceso a él.";
    if (err.status === 400) return `OpenAI rechazó la petición: ${err.message}`;
    return `Error de OpenAI (${err.status ?? "sin código"}).`;
  }
  return "No se pudo contactar con OpenAI.";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return errorResponse(500, "Falta OPENAI_API_KEY en el servidor. Revisa tu archivo .env.local.");
  }

  // Solo se aceptan peticiones desde la propia app.
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return errorResponse(403, "Origen no permitido.");
    } catch {
      return errorResponse(403, "Origen no permitido.");
    }
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!checkRateLimit(ip)) {
    return errorResponse(429, "Demasiados mensajes seguidos. Espera un momento.");
  }

  let body: ChatRequestBody | null;
  try {
    body = parseBody(await req.json());
  } catch {
    body = null;
  }
  if (!body) return errorResponse(400, "Petición no válida.");

  let persona;
  try {
    persona = await loadPersona();
  } catch (err) {
    console.error("[chat] Error cargando la personalidad:", err);
    return errorResponse(500, "No se pudo cargar la personalidad (carpeta persona/).");
  }

  const { settings } = persona;
  const history = body.messages.slice(-settings.maxHistoryMessages);
  const lastUserMessage = history[history.length - 1].content;

  // Etapa 2: aquí entrará el contexto de memoria persistente.
  const memoryContext = await memory.recall({ sessionId: body.sessionId, query: lastUserMessage });

  const systemPrompt = [
    persona.instructions,
    memoryContext ? `## Lo que recuerdas de esta persona\n${memoryContext}` : "",
    emotionProtocolInstruction(),
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const params: ChatCompletionCreateParamsStreaming = {
    model: process.env.OPENAI_MODEL || settings.model || DEFAULT_MODEL,
    messages,
    stream: true,
  };
  if (typeof settings.temperature === "number") params.temperature = settings.temperature;
  if (typeof settings.maxOutputTokens === "number") params.max_completion_tokens = settings.maxOutputTokens;

  const client = new OpenAI({ apiKey });

  let completion;
  try {
    completion = await client.chat.completions.create(params, { signal: req.signal });
  } catch (err) {
    console.error("[chat] Error de OpenAI:", err);
    return errorResponse(502, describeOpenAIError(err));
  }

  const encoder = new TextEncoder();
  const parser = createEmotionTagParser();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      let fullText = "";

      try {
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content;
          if (!text) continue;
          for (const event of parser.push(text)) {
            if (event.type === "delta") fullText += event.text;
            send(event);
          }
        }
        for (const event of parser.flush()) {
          if (event.type === "delta") fullText += event.text;
          send(event);
        }
        send({ type: "done" });

        // Etapa 2: guardar en memoria persistente (hoy no hace nada).
        memory
          .remember({ sessionId: body.sessionId, userMessage: lastUserMessage, assistantMessage: fullText })
          .catch((err) => console.error("[chat] Error en memory.remember:", err));
      } catch (err) {
        if (!req.signal.aborted) {
          console.error("[chat] Error durante el streaming:", err);
          try {
            send({ type: "error", message: describeOpenAIError(err) });
          } catch {
            /* el cliente ya se fue */
          }
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* ya cerrado */
        }
      }
    },
    cancel() {
      completion.controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
