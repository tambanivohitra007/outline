import env from "@server/env";
import fetch from "@server/utils/fetch";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

interface GenerateOptions {
  conditionName: string;
  sectionType: string;
  existingContent?: string;
  additionalContext?: string;
}

/**
 * Service for generating medical content using Google Gemini API.
 */
export default class GeminiService {
  /**
   * Generate content for a condition section using Gemini.
   *
   * @param options Generation options including condition name and section type.
   * @returns Generated markdown content.
   */
  static async generateContent(options: GenerateOptions): Promise<string> {
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = GeminiService.buildPrompt(options);

    const url = `${GEMINI_API_URL}/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return text;
  }

  /**
   * Interpret a natural language search query and return structured search parameters.
   *
   * @param query The natural language search query.
   * @returns Structured search parameters extracted by AI.
   */
  static async interpretSearch(query: string): Promise<{
    keywords: string[];
    conditionTerms: string[];
    interventionTerms: string[];
    recipeTerms: string[];
    intent: string;
  }> {
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are a medical knowledge base search assistant. Given a user's search query, extract structured search parameters.

User query: "${query}"

Respond with ONLY valid JSON (no markdown fences) in this exact format:
{
  "keywords": ["general", "search", "terms"],
  "conditionTerms": ["medical condition names or symptoms to search for"],
  "interventionTerms": ["treatment or intervention terms to search for"],
  "recipeTerms": ["food, recipe, or nutrition terms to search for"],
  "intent": "brief description of what the user is looking for"
}

If the query doesn't relate to a category, return an empty array for that field.`;

    const url = `${GEMINI_API_URL}/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      timeout: 15000,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    const parsed = JSON.parse(text.trim());

    return {
      keywords: parsed.keywords ?? [],
      conditionTerms: parsed.conditionTerms ?? [],
      interventionTerms: parsed.interventionTerms ?? [],
      recipeTerms: parsed.recipeTerms ?? [],
      intent: parsed.intent ?? query,
    };
  }

  /**
   * Generate suggestions for a condition section based on existing data.
   *
   * @param conditionName The condition name.
   * @param sectionType The section type.
   * @param existingData Context data about existing interventions, evidence, etc.
   * @returns Suggested content as markdown.
   */
  static async generateSuggestions(
    conditionName: string,
    sectionType: string,
    existingData: string
  ): Promise<string> {
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are a medical knowledge assistant for lifestyle medicine. For the condition "${conditionName}", section "${sectionType.replace(/_/g, " ")}":

Here is the existing data in this knowledge base:
${existingData}

Based on this, suggest:
1. Related interventions or treatments that could be added
2. Evidence gaps that should be filled
3. Cross-references to other conditions that share similar interventions
4. Potential scripture or Spirit of Prophecy references (if applicable to section type)

Keep suggestions concise and actionable. Format as markdown bullet points.`;

    const url = `${GEMINI_API_URL}/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      timeout: 20000,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  /**
   * Build a prompt for content generation based on section type.
   *
   * @param options The generation options.
   * @returns The formatted prompt string.
   */
  private static buildPrompt(options: GenerateOptions): string {
    const { conditionName, sectionType, existingContent, additionalContext } =
      options;

    const sectionPrompts: Record<string, string> = {
      risk_factors: `List and explain the key risk factors for ${conditionName}. Include modifiable and non-modifiable risk factors. For each risk factor, provide a brief explanation of the mechanism. Format as markdown with headers and bullet points.`,

      physiology: `Explain the physiology and pathophysiology of ${conditionName}. Cover the normal physiological processes involved, how they become disrupted in this condition, and the cascade of effects. Use medical terminology but explain concepts clearly. Format as markdown.`,

      complications: `Describe the potential complications and comorbidities associated with ${conditionName}. Include both acute and chronic complications, their mechanisms, and warning signs. Format as markdown with headers and bullet points.`,

      solutions: `Provide evidence-based therapeutic interventions for ${conditionName} organized by the NEWSTART+ lifestyle medicine framework:
- **Nutrition**: Dietary recommendations and therapeutic foods
- **Exercise**: Physical activity prescriptions
- **Water Therapy**: Hydrotherapy applications
- **Sunlight**: Light therapy and vitamin D considerations
- **Temperance**: Substances to avoid and moderation principles
- **Air**: Breathing exercises and air quality considerations
- **Rest**: Sleep hygiene and recovery protocols
- **Trust in God**: Spiritual and mental health support
- **Supplements**: Evidence-based supplementation
- **Medications**: Conventional medical treatments when needed

Format as markdown with clear sections.`,

      bible_sop: `Suggest relevant Bible passages and Spirit of Prophecy references that relate to the principles of health and healing applicable to ${conditionName}. Include the scriptural reference, the text, and a brief explanation of its relevance. Format as markdown.`,

      research_ideas: `Suggest potential research topics and study designs related to ${conditionName} from a lifestyle medicine perspective. Include:
- Research gaps in current literature
- Potential clinical trial designs
- Observational study opportunities
- Areas where lifestyle interventions need more evidence
Format as markdown with specific, actionable research proposals.`,
    };

    let prompt = `You are a medical knowledge assistant specializing in lifestyle medicine and integrative health. Generate content for the "${sectionType.replace(/_/g, " ")}" section of a treatment guide for ${conditionName}.\n\n`;

    prompt += sectionPrompts[sectionType] ?? `Generate comprehensive content about ${conditionName} for the ${sectionType} section. Format as markdown.`;

    if (existingContent) {
      prompt += `\n\nExisting content to build upon:\n${existingContent}`;
    }

    if (additionalContext) {
      prompt += `\n\nAdditional context:\n${additionalContext}`;
    }

    return prompt;
  }
}
