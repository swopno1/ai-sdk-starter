import { model, type modelID } from "@/ai/providers";
import { weatherTool } from "@/ai/tools";
import { generateText } from "ai";
import { convertToModelMessages, UIMessage } from "ai";
import { JSONResponse } from "ai/rsc";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    selectedModel,
  }: { messages: UIMessage[]; selectedModel: modelID } = await req.json();

  const result = await generateText({
    model: model.languageModel(selectedModel),
    system: "You are a helpful assistant.",
    messages: convertToModelMessages(messages),
  });

  return new JSONResponse(result, {
    status: 200,
  });
}
