import env from "@server/env";
import AnthropicService from "./AnthropicService";
import GeminiService from "./GeminiService";
import OpenAIService from "./OpenAIService";

/** Supported AI model identifiers. */
export const AI_MODELS = {
  "gemini-2.0-flash": {
    label: "Gemini 2.0 Flash",
    provider: "gemini",
  },
  "gpt-5": {
    label: "GPT-5",
    provider: "openai",
  },
  "claude-sonnet-4-6": {
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
  },
} as const;

export type AIModelId = keyof typeof AI_MODELS;

interface GenerateOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Unified AI service that dispatches to the configured provider.
 */
export default class AIService {
  /**
   * Generate text using the specified model.
   *
   * @param modelId The model identifier to use.
   * @param options Generation options including prompt and parameters.
   * @returns Generated text content.
   * @throws Error if the model or provider is not available.
   */
  static async generate(
    modelId: string,
    options: GenerateOptions
  ): Promise<string> {
    const model = AI_MODELS[modelId as AIModelId];

    if (!model) {
      throw new Error(`Unknown AI model: ${modelId}`);
    }

    switch (model.provider) {
      case "gemini":
        return GeminiService.generateRaw(options);
      case "openai":
        return OpenAIService.generate(options);
      case "anthropic":
        return AnthropicService.generate(options);
      default:
        throw new Error(`Unsupported AI provider: ${model.provider}`);
    }
  }

  /**
   * Return the list of available AI models based on configured env vars.
   *
   * @returns Array of available model IDs with their labels.
   */
  static getAvailableModels(): Array<{
    id: string;
    label: string;
    provider: string;
  }> {
    const available: Array<{ id: string; label: string; provider: string }> =
      [];

    for (const [id, model] of Object.entries(AI_MODELS)) {
      let isAvailable = false;

      switch (model.provider) {
        case "gemini":
          isAvailable = !!env.GEMINI_API_KEY;
          break;
        case "openai":
          isAvailable = !!env.OPENAI_API_KEY;
          break;
        case "anthropic":
          isAvailable = !!env.ANTHROPIC_API_KEY;
          break;
      }

      if (isAvailable) {
        available.push({ id, label: model.label, provider: model.provider });
      }
    }

    return available;
  }
}
