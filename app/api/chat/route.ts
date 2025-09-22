import { model, type modelID } from "@/ai/providers";
import { weatherTool } from "@/ai/tools";
import { createUIMessageStream, generateText, streamText } from "ai";
import { convertToModelMessages, UIMessage } from "ai";
import {
  CoreMessage,
  ToolCallPart,
  ToolResultPart,
} from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    selectedModel,
  }: { messages: UIMessage[]; selectedModel: modelID } = await req.json();

  const stream = createUIMessageStream();

  (async () => {
    let coreMessages: CoreMessage[] = convertToModelMessages(messages);

    const result = await generateText({
      model: model.languageModel(selectedModel),
      system: "You are a helpful assistant.",
      messages: coreMessages,
      tools: {
        getWeather: weatherTool,
      },
    });

    for (const toolCall of result.toolCalls) {
      stream.append({
        type: "tool-call",
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName,
        args: toolCall.args,
      });

      const toolResult = await toolCall.execute();

      stream.append({
        type: "tool-result",
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName,
        result: toolResult,
      });

      coreMessages = [
        ...coreMessages,
        { role: "assistant", content: [{ type: "tool-call", toolCall }] },
        { role: "tool", content: [{ type: "tool-result", toolCall, result: toolResult }] },
      ];
    }

    const { text } = await generateText({
      model: model.languageModel(selectedModel),
      messages: coreMessages,
    });

    stream.done({
      type: "assistant-message",
      content: text,
    });
  })();

  return stream.toResponse();
}
