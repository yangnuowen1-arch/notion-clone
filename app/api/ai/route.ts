import { createOpenAI } from "@ai-sdk/openai";
import { ollama } from "ai-sdk-ollama";
import { convertToModelMessages, streamText } from "ai";
import {
  aiDocumentFormats,
  injectDocumentStateMessages,
  toolDefinitionsToToolSet,
} from "@blocknote/xl-ai/server";

export const maxDuration = 30;

function getModel() {
  const ollamaModel = process.env.OLLAMA_MODEL;
  if (ollamaModel) {
    return ollama(ollamaModel);
  }
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  });
  return openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini");
}

export async function POST(req: Request) {
  try {
    const { messages, toolDefinitions } = await req.json();

    const result = streamText({
      model: getModel(),
      system: aiDocumentFormats.html.systemPrompt,
      messages: await convertToModelMessages(
        injectDocumentStateMessages(messages),
      ),
      tools: toolDefinitionsToToolSet(toolDefinitions),
      toolChoice: "required",
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
