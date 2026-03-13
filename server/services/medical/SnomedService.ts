import env from "@server/env";

const SNOMED_BASE_URL =
  env.SNOMED_API_URL ?? "https://browser.ihtsdotools.org/snowstorm/snomed-ct";
const SNOMED_EDITION = "MAIN";

interface SnomedConcept {
  conceptId: string;
  fsn: { term: string };
  pt: { term: string };
  active: boolean;
}

interface SnomedSearchResult {
  items: SnomedConcept[];
  total: number;
}

/**
 * Service for interacting with the SNOMED CT terminology API.
 */
export default class SnomedService {
  /**
   * Search SNOMED CT concepts by term.
   *
   * @param term The search term.
   * @param limit Maximum results to return.
   * @returns Matching SNOMED concepts.
   */
  static async search(
    term: string,
    limit = 20
  ): Promise<{ conceptId: string; term: string; fsn: string }[]> {
    const url = `${SNOMED_BASE_URL}/${SNOMED_EDITION}/concepts?term=${encodeURIComponent(term)}&activeFilter=true&limit=${limit}&offset=0`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`SNOMED API error: ${response.status}`);
    }

    const data: SnomedSearchResult = await response.json();

    return data.items.map((item) => ({
      conceptId: item.conceptId,
      term: item.pt.term,
      fsn: item.fsn.term,
    }));
  }

  /**
   * Look up a single SNOMED CT concept by ID.
   *
   * @param conceptId The SNOMED concept ID.
   * @returns The concept details or null.
   */
  static async lookup(
    conceptId: string
  ): Promise<{ conceptId: string; term: string; fsn: string } | null> {
    const url = `${SNOMED_BASE_URL}/${SNOMED_EDITION}/concepts/${conceptId}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`SNOMED API error: ${response.status}`);
    }

    const data: SnomedConcept = await response.json();

    return {
      conceptId: data.conceptId,
      term: data.pt.term,
      fsn: data.fsn.term,
    };
  }
}
