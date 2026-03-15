import env from "@server/env";
import fetch from "@server/utils/fetch";

const BIBLE_API_URL = "https://api.scripture.api.bible/v1";

interface BibleVerse {
  reference: string;
  text: string;
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
}

interface BibleTranslation {
  id: string;
  name: string;
  nameLocal: string;
  abbreviation: string;
  abbreviationLocal: string;
  language: string;
  description: string;
}

/**
 * Service for interacting with the API.Bible service.
 * Falls back to returning reference-only results if no API key is configured.
 */
export default class BibleService {
  /**
   * Check whether the Bible API key is configured.
   *
   * @returns True if BIBLE_API_KEY is set.
   */
  static isConfigured(): boolean {
    return !!env.BIBLE_API_KEY;
  }

  /**
   * List available Bible translations/versions.
   *
   * @param language Optional language filter (e.g., "eng").
   * @returns Available translations.
   */
  static async listTranslations(
    language?: string
  ): Promise<BibleTranslation[]> {
    const apiKey = env.BIBLE_API_KEY;
    if (!apiKey) {
      return [];
    }

    const params = language ? `?language=${encodeURIComponent(language)}` : "";
    const response = await fetch(`${BIBLE_API_URL}/bibles${params}`, {
      headers: {
        "api-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status}`);
    }

    const data = await response.json();
    const bibles = data.data ?? [];

    return bibles.map((b: Record<string, unknown>) => ({
      id: b.id ?? "",
      name: b.name ?? "",
      nameLocal: b.nameLocal ?? b.name ?? "",
      abbreviation: b.abbreviation ?? "",
      abbreviationLocal: b.abbreviationLocal ?? b.abbreviation ?? "",
      language: (b.language as Record<string, string>)?.name ?? "",
      description: b.description ?? "",
    }));
  }

  /**
   * Search for Bible passages matching a query.
   *
   * @param query The search query.
   * @param translation Bible translation ID (default KJV).
   * @param limit Maximum results.
   * @returns Matching verses.
   */
  static async search(
    query: string,
    translation = "de4e12af7f28f599-02",
    limit = 20
  ): Promise<{ reference: string; text: string }[]> {
    const apiKey = env.BIBLE_API_KEY;

    if (!apiKey) {
      return [];
    }

    const url = `${BIBLE_API_URL}/bibles/${translation}/search?query=${encodeURIComponent(query)}&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        "api-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status}`);
    }

    const data = await response.json();
    const verses = data.data?.verses ?? [];

    return verses.map((verse: Record<string, string>) => ({
      reference: verse.reference ?? "",
      text: (verse.text ?? "").replace(/<[^>]*>/g, "").trim(),
    }));
  }

  /**
   * Look up a specific Bible verse by reference.
   *
   * @param reference The verse reference (e.g., "JHN.3.16").
   * @param translation Bible translation ID.
   * @returns The verse text or null.
   */
  static async getVerse(
    reference: string,
    translation = "de4e12af7f28f599-02"
  ): Promise<{ reference: string; text: string } | null> {
    const apiKey = env.BIBLE_API_KEY;

    if (!apiKey) {
      return null;
    }

    const url = `${BIBLE_API_URL}/bibles/${translation}/verses/${encodeURIComponent(reference)}?content-type=text`;

    const response = await fetch(url, {
      headers: {
        "api-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Bible API error: ${response.status}`);
    }

    const data = await response.json();
    const verse = data.data;

    return {
      reference: verse?.reference ?? reference,
      text: (verse?.content ?? "").replace(/<[^>]*>/g, "").trim(),
    };
  }
}
