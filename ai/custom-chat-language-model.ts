import {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2Content,
  LanguageModelV2Prompt,
  LanguageModelV2StreamPart,
} from "@ai-sdk/provider";
import {
  UnsupportedFunctionalityError,
} from "@ai-sdk/provider";

export class CustomChatLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = "v2";
  readonly provider = "custom";
  readonly modelId: string;

  constructor(
    modelId: string,
  ) {
    this.modelId = modelId;
  }

  async doGenerate(
    options: LanguageModelV2CallOptions,
  ): Promise<{
    content: LanguageModelV2Content[];
    finishReason: "stop" | "tool-calls" | "error" | "other";
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
    warnings: LanguageModelV2CallWarning[];
  }> {
    const { messages } = this.convertToProviderMessages(options.prompt);

    const response = await fetch("http://localhost:8000/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.modelId,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxOutputTokens,
      }),
    });

    const data = await response.json();

    return {
      content: [{ type: "text", text: data.choices[0].message.content }],
      finishReason: "stop", // Assuming stop, as local model may not provide this
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? (data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0),
      },
      warnings: [],
    };
  }

  private convertToProviderMessages(prompt: LanguageModelV2Prompt): {
    messages: { role: string; content: string }[];
  } {
    const messages: { role: string; content: string }[] = [];
    for (const message of prompt) {
      if (message.role === "user" || message.role === "assistant") {
        const content = message.content
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("");
        messages.push({ role: message.role, content });
      }
    }
    return { messages };
  }

  async doStream(options: LanguageModelV2CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV2StreamPart>;
    warnings?: any;
    rawResponse?: { headers?: Record<string, string> };
  }> {
    throw new UnsupportedFunctionalityError({
      functionality: "doStream",
    });
  }

  get supportedUrls(): Record<string, RegExp[]> {
    return {};
  }
}
