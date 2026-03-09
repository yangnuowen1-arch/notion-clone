import { createOpenAI } from "@ai-sdk/openai";
import {
  createOllama,
  streamText as ollamaStreamText,
} from "ai-sdk-ollama";
import { convertToModelMessages, streamText } from "ai";
import {
  aiDocumentFormats,
  injectDocumentStateMessages,
  toolDefinitionsToToolSet,
} from "@blocknote/xl-ai/server";

export const maxDuration = 30;

const FORCE_TOOL_PROMPT = `
You are editing a BlockNote document.
You must use the provided tools to modify the document.
Do not answer conversationally.
Do not ask follow-up questions.
Do not return plain text explanations unless the tool list is empty.
If the user asks to rewrite, simplify, polish, shorten, expand, improve, or edit text, you must call a tool.
If a selection is present, operate directly on that selection.
Your goal is to perform the edit, not to discuss the edit.
`.trim();

function summarizeToolCalls(toolCalls: Array<{ toolName?: string; toolCallId?: string; input?: unknown }>) {
  return toolCalls.map((call) => ({
    toolName: call.toolName,
    toolCallId: call.toolCallId,
    input:
      typeof call.input === "object" && call.input !== null
        ? JSON.stringify(call.input).slice(0, 300)
        : call.input,
  }));
}

function summarizeToolResults(toolResults: Array<{ toolName?: string; toolCallId?: string; output?: unknown; result?: unknown }>) {
  return toolResults.map((result) => ({
    toolName: result.toolName,
    toolCallId: result.toolCallId,
    outputPreview: JSON.stringify(result.output ?? result.result ?? null).slice(0, 300),
  }));
}

function hasTextWithoutToolCalls(event: {
  text: string;
  toolCalls: Array<unknown>;
  steps: Array<{ text: string; toolCalls: Array<unknown> }>;
}) {
  if (event.toolCalls.length > 0) {
    return false;
  }
  if (event.text.trim().length > 0) {
    return true;
  }
  return event.steps.some((step) => step.toolCalls.length === 0 && step.text.trim().length > 0);
}

function getOpenAIModel() {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  });
  return openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini");
}

function getOllamaModel() {
  const ollamaModel = process.env.OLLAMA_MODEL;
  if (!ollamaModel) {
    return null;
  }
  const ollama = createOllama({
    baseURL: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  });
  return ollama(ollamaModel);
}

export async function POST(req: Request) {
  try {
    const { messages, toolDefinitions } = await req.json();
    const ollamaModel = getOllamaModel();
    const modelLabel = ollamaModel
      ? `ollama:${process.env.OLLAMA_MODEL}`
      : `openai:${process.env.OPENAI_MODEL ?? "gpt-4o-mini"}`;

    console.log("[/api/ai] request", {
      model: modelLabel,
      messageCount: Array.isArray(messages) ? messages.length : 0,
      toolDefinitionCount: toolDefinitions ? Object.keys(toolDefinitions).length : 0,
    });

    let respondedWithPlainTextOnly = false;

    const commonOptions = {
      system: `${aiDocumentFormats.html.systemPrompt}\n\n${FORCE_TOOL_PROMPT}`,
      messages: await convertToModelMessages(
        injectDocumentStateMessages(messages),
      ),
      tools: toolDefinitionsToToolSet(toolDefinitions),
      toolChoice: "required" as const,
      onFinish: async (event: {
        finishReason: string;
        text: string;
        toolCalls: Array<{ toolName?: string; toolCallId?: string; input?: unknown }>;
        toolResults: Array<{ toolName?: string; toolCallId?: string; output?: unknown; result?: unknown }>;
        steps: Array<{
          stepNumber: number;
          finishReason: string;
          text: string;
          toolCalls: Array<{ toolName?: string; toolCallId?: string; input?: unknown }>;
          toolResults: Array<{ toolName?: string; toolCallId?: string; output?: unknown; result?: unknown }>;
        }>;
      }) => {
        respondedWithPlainTextOnly = hasTextWithoutToolCalls(event);
        console.log("[/api/ai] onFinish", {
          model: modelLabel,
          finishReason: event.finishReason,
          textLength: event.text.length,
          textPreview: event.text.slice(0, 300),
          toolCallCount: event.toolCalls.length,
          toolCalls: summarizeToolCalls(event.toolCalls),
          toolResultCount: event.toolResults.length,
          toolResults: summarizeToolResults(event.toolResults),
          steps: event.steps.map((step) => ({
            stepNumber: step.stepNumber,
            finishReason: step.finishReason,
            textLength: step.text.length,
            textPreview: step.text.slice(0, 160),
            toolCalls: summarizeToolCalls(step.toolCalls),
            toolResults: summarizeToolResults(step.toolResults),
          })),
          respondedWithPlainTextOnly,
        });
      },
    };

    const result = await (ollamaModel
      ? ollamaStreamText({
        model: ollamaModel,
        ...commonOptions,
      })
      : streamText({
        model: getOpenAIModel(),
        ...commonOptions,
      }));

    if (respondedWithPlainTextOnly) {
      return new Response(
        JSON.stringify({
          error:
            "Model responded with plain text instead of BlockNote tool calls. Try a stronger tool-calling model or a more direct edit instruction.",
          code: "NO_TOOL_CALLS",
          model: modelLabel,
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[/api/ai]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
