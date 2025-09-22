import { deepinfra } from "@ai-sdk/deepinfra";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

const localLlamaProvider = wrapLanguageModel({
  middleware: extractReasoningMiddleware({
    tagName: "think",
  }),
  // Directly provide the chat function here, not via customProvider
  model: {
    async chat({
      messages,
      temperature,
      maxTokens,
    }: {
      messages: Array<{ role: string; content: string }>;
      temperature: number;
      maxTokens: number;
    }) {
      const response = await fetch(
        "http://localhost:8000/v1/chat/completions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "local-llama",
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        }
      );
      const data = await response.json();
      return { content: data.choices[0].message.content };
    },
  },
});

const languageModels = {
  "local-llama": localLlamaProvider,
  "meta-llama/Llama-3.3-70B-Instruct-Turbo": wrapLanguageModel({
    middleware: extractReasoningMiddleware({
      tagName: "think",
    }),
    model: deepinfra("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
  }),
  "deepseek-ai/DeepSeek-R1": wrapLanguageModel({
    middleware: extractReasoningMiddleware({
      tagName: "think",
    }),
    model: deepinfra("deepseek-ai/DeepSeek-R1"),
  }),
  "Qwen/Qwen2.5-72B-Instruct": deepinfra("Qwen/Qwen2.5-72B-Instruct"),
};

export const model = customProvider({
  languageModels,
});

export type modelID = keyof typeof languageModels;

export const MODELS = Object.keys(languageModels);

export const defaultModel: modelID = "deepseek-ai/DeepSeek-R1";
