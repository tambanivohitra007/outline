import env from "@server/env";

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  publicationDate: string;
  doi: string | null;
  abstract: string | null;
}

/**
 * Service for interacting with the NCBI PubMed E-utilities API.
 */
export default class PubMedService {
  /**
   * Search PubMed for articles matching a query.
   *
   * @param query The search query.
   * @param limit Maximum results to return.
   * @returns Array of PubMed article summaries.
   */
  static async search(
    query: string,
    limit = 20
  ): Promise<{ pmid: string; title: string; authors: string; journal: string }[]> {
    const apiKey = env.PUBMED_API_KEY ? `&api_key=${env.PUBMED_API_KEY}` : "";

    // Step 1: Search for IDs
    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json${apiKey}`;
    const searchRes = await fetch(searchUrl);

    if (!searchRes.ok) {
      throw new Error(`PubMed search error: ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    const ids: string[] = searchData.esearchresult?.idlist ?? [];

    if (ids.length === 0) {
      return [];
    }

    // Step 2: Fetch summaries
    const summaryUrl = `${PUBMED_BASE_URL}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json${apiKey}`;
    const summaryRes = await fetch(summaryUrl);

    if (!summaryRes.ok) {
      throw new Error(`PubMed summary error: ${summaryRes.status}`);
    }

    const summaryData = await summaryRes.json();
    const results = summaryData.result ?? {};

    return ids
      .filter((id) => results[id])
      .map((id) => {
        const article = results[id];
        const authors = (article.authors ?? [])
          .map((a: { name: string }) => a.name)
          .join(", ");

        return {
          pmid: id,
          title: article.title ?? "",
          authors,
          journal: article.fulljournalname ?? article.source ?? "",
        };
      });
  }

  /**
   * Fetch a full PubMed article by PMID.
   *
   * @param pmid The PubMed ID.
   * @returns Article details including abstract.
   */
  static async fetchArticle(pmid: string): Promise<PubMedArticle | null> {
    const apiKey = env.PUBMED_API_KEY ? `&api_key=${env.PUBMED_API_KEY}` : "";

    // Fetch summary for basic info
    const summaryUrl = `${PUBMED_BASE_URL}/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json${apiKey}`;
    const summaryRes = await fetch(summaryUrl);

    if (!summaryRes.ok) {
      return null;
    }

    const summaryData = await summaryRes.json();
    const article = summaryData.result?.[pmid];

    if (!article) {
      return null;
    }

    // Fetch abstract
    const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text${apiKey}`;
    const fetchRes = await fetch(fetchUrl);
    const abstractText = fetchRes.ok ? await fetchRes.text() : null;

    const authors = (article.authors ?? [])
      .map((a: { name: string }) => a.name)
      .join(", ");

    const doi =
      (article.articleids ?? []).find(
        (aid: { idtype: string; value: string }) => aid.idtype === "doi"
      )?.value ?? null;

    return {
      pmid,
      title: article.title ?? "",
      authors,
      journal: article.fulljournalname ?? article.source ?? "",
      publicationDate: article.pubdate ?? "",
      doi,
      abstract: abstractText?.trim() ?? null,
    };
  }
}
