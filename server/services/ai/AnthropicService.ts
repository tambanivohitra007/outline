import env from "@server/env";
import fetch from "@server/utils/fetch";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1";

interface GenerateOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Service for generating content using the Anthropic API.
 */
export default class AnthropicService {
  /**
   * Generate text content using the Anthropic messages API.
   *
   * @param options Generation options including prompt and parameters.
   * @returns Generated text content.
   * @throws Error if API key is not configured or API call fails.
   */
  static async generate(options: GenerateOptions): Promise<string> {
    const apiKey = env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const response = await fetch(`${ANTHROPIC_API_URL}/messages`, {
      method: "POST",
      timeout: 120000,
      allowPrivateIPAddress: true,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: options.maxTokens ?? 4096,
        messages: [{ role: "user", content: options.prompt }],
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const textBlocks = data.content?.filter(
      (block: { type: string }) => block.type === "text"
    );
    return textBlocks?.map((b: { text: string }) => b.text).join("") ?? "";
  }

  /**
   * Check if the Anthropic API key is configured.
   *
   * @returns True if the API key is set.
   */
  static isAvailable(): boolean {
    return !!env.ANTHROPIC_API_KEY;
  }
}
