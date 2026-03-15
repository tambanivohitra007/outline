import env from "@server/env";
import fetch from "@server/utils/fetch";
import Logger from "@server/logging/Logger";

const EGW_BASE = "https://a.egwwritings.org";
const TOKEN_URL = "https://cpanel.egwwritings.org/connect/token";

interface EgwBook {
  id: number;
  title: string;
  abbreviation: string;
  author: string;
  lang: string;
  folder: string;
  type: string;
  publicationYear: number | null;
}

interface EgwSearchHit {
  reference: string;
  text: string;
  bookTitle: string;
  bookId: number;
  paraId: string;
}

interface EgwParagraph {
  paraId: string;
  text: string;
  refcode: string;
}

/** Cached OAuth token */
let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Service for interacting with the Ellen G. White Writings API.
 * Requires EGW_CLIENT_ID and EGW_CLIENT_SECRET environment variables.
 *
 * @see https://a.egwwritings.org/swagger/
 */
export default class EgwService {
  /**
   * Obtain an OAuth access token using client credentials grant.
   *
   * @returns Bearer token string.
   * @throws If credentials are missing or token request fails.
   */
  private static async getToken(): Promise<string> {
    const clientId = env.EGW_CLIENT_ID;
    const clientSecret = env.EGW_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("EGW_CLIENT_ID and EGW_CLIENT_SECRET are required");
    }

    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
      return cachedToken.value;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "writings search",
    });

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      Logger.warn("EGW token request failed", { status: response.status });
      throw new Error(`EGW OAuth error: ${response.status}`);
    }

    const data = await response.json();
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };

    return cachedToken.value;
  }

  /**
   * Check whether EGW credentials are configured.
   *
   * @returns True if both client ID and secret are set.
   */
  static isConfigured(): boolean {
    return !!(env.EGW_CLIENT_ID && env.EGW_CLIENT_SECRET);
  }

  /**
   * Search EGW writings for a query string.
   *
   * @param query Search term.
   * @param limit Max results (1-100).
   * @param lang Language code.
   * @returns Matching passages.
   */
  static async search(
    query: string,
    limit = 20,
    lang = "en"
  ): Promise<EgwSearchHit[]> {
    const token = await this.getToken();

    const params = new URLSearchParams({
      query,
      limit: String(Math.min(limit, 100)),
      lang,
      snippet: "full",
    });

    const response = await fetch(`${EGW_BASE}/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`EGW search error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results ?? data.hits ?? [];

    return results.map((hit: Record<string, unknown>) => ({
      reference: (hit.refcode_long ?? hit.refcode_short ?? hit.reference ?? "") as string,
      text: ((hit.content ?? hit.snippet ?? hit.text ?? "") as string)
        .replace(/<[^>]*>/g, "")
        .trim(),
      bookTitle: (hit.book_title ?? hit.title ?? "") as string,
      bookId: (hit.pubnr ?? hit.book_id ?? 0) as number,
      paraId: String(hit.para_id ?? hit.element_id ?? ""),
    }));
  }

  /**
   * List available EGW books, optionally filtered by search term.
   *
   * @param search Filter by title.
   * @param lang Language code.
   * @returns Books list.
   */
  static async listBooks(
    search?: string,
    lang = "en"
  ): Promise<EgwBook[]> {
    const token = await this.getToken();

    const params = new URLSearchParams({ lang });
    if (search) {
      params.set("search", search);
    }

    const response = await fetch(
      `${EGW_BASE}/content/books/shortlist?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`EGW books error: ${response.status}`);
    }

    const books = await response.json();

    return (books ?? []).map((b: Record<string, unknown>) => ({
      id: b.pubnr ?? b.id ?? 0,
      title: (b.title ?? "") as string,
      abbreviation: (b.abbreviation ?? b.code ?? "") as string,
      author: (b.author ?? "Ellen G. White") as string,
      lang: (b.lang ?? lang) as string,
      folder: (b.folder ?? "") as string,
      type: (b.type ?? "") as string,
      publicationYear: (b.pub_year ?? null) as number | null,
    }));
  }

  /**
   * Get table of contents for a specific book.
   *
   * @param bookId The book publication number.
   * @returns Table of contents entries.
   */
  static async getBookToc(
    bookId: number
  ): Promise<{ title: string; paraId: string; level: number }[]> {
    const token = await this.getToken();

    const response = await fetch(
      `${EGW_BASE}/content/books/${bookId}/toc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`EGW TOC error: ${response.status}`);
    }

    const toc = await response.json();

    return (toc ?? []).map((entry: Record<string, unknown>) => ({
      title: (entry.title ?? "") as string,
      paraId: String(entry.para_id ?? entry.element_id ?? ""),
      level: (entry.level ?? 0) as number,
    }));
  }

  /**
   * Get content of a specific chapter/paragraph in a book.
   *
   * @param bookId The book publication number.
   * @param paraId The paragraph/element ID.
   * @returns Paragraphs of content.
   */
  static async getContent(
    bookId: number,
    paraId: string
  ): Promise<EgwParagraph[]> {
    const token = await this.getToken();

    const response = await fetch(
      `${EGW_BASE}/content/books/${bookId}/chapter/${paraId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`EGW content error: ${response.status}`);
    }

    const paragraphs = await response.json();

    return (paragraphs ?? []).map((p: Record<string, unknown>) => ({
      paraId: String(p.para_id ?? p.element_id ?? ""),
      text: ((p.content ?? p.text ?? "") as string)
        .replace(/<[^>]*>/g, "")
        .trim(),
      refcode: (p.refcode_long ?? p.refcode_short ?? "") as string,
    }));
  }
}
