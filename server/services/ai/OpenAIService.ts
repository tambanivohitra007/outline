import env from "@server/env";
import Logger from "@server/logging/Logger";
import fetch from "@server/utils/fetch";

const OPENAI_API_URL = "https://api.openai.com/v1";

interface GenerateOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Service for generating content using OpenAI API.
 */
export default class OpenAIService {
  /**
   * Generate text content using the OpenAI chat completions API.
   *
   * @param options Generation options including prompt and parameters.
   * @returns Generated text content.
   * @throws Error if API key is not configured or API call fails.
   */
  static async generate(options: GenerateOptions): Promise<string> {
    const apiKey = env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const url = `${OPENAI_API_URL}/chat/completions`;
    const payload = {
      model: "gpt-5.2",
      messages: [{ role: "user", content: options.prompt }],
      max_completion_tokens: options.maxTokens ?? 4096,
    };

    Logger.debug("ai", `OpenAI request to ${url}`, { model: payload.model });

    const response = await fetch(url, {
      method: "POST",
      timeout: 120000,
      allowPrivateIPAddress: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  /**
   * Check if the OpenAI API key is configured.
   *
   * @returns True if the API key is set.
   */
  static isAvailable(): boolean {
    return !!env.OPENAI_API_KEY;
  }
}
