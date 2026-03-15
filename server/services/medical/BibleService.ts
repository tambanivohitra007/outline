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

/** Maps common book names to API.Bible 3-letter IDs */
const BOOK_IDS: Record<string, string> = {
  genesis: "GEN", gen: "GEN",
  exodus: "EXO", exo: "EXO", ex: "EXO",
  leviticus: "LEV", lev: "LEV",
  numbers: "NUM", num: "NUM",
  deuteronomy: "DEU", deut: "DEU", deu: "DEU",
  joshua: "JOS", josh: "JOS",
  judges: "JDG", judg: "JDG",
  ruth: "RUT",
  "1 samuel": "1SA", "1samuel": "1SA", "1 sam": "1SA", "1sam": "1SA",
  "2 samuel": "2SA", "2samuel": "2SA", "2 sam": "2SA", "2sam": "2SA",
  "1 kings": "1KI", "1kings": "1KI", "1 kgs": "1KI",
  "2 kings": "2KI", "2kings": "2KI", "2 kgs": "2KI",
  "1 chronicles": "1CH", "1chronicles": "1CH", "1 chr": "1CH",
  "2 chronicles": "2CH", "2chronicles": "2CH", "2 chr": "2CH",
  ezra: "EZR",
  nehemiah: "NEH", neh: "NEH",
  esther: "EST", esth: "EST",
  job: "JOB",
  psalms: "PSA", psalm: "PSA", ps: "PSA", psa: "PSA",
  proverbs: "PRO", prov: "PRO", pro: "PRO",
  ecclesiastes: "ECC", eccl: "ECC", ecc: "ECC",
  "song of solomon": "SNG", "song": "SNG", "songs": "SNG", sng: "SNG",
  isaiah: "ISA", isa: "ISA",
  jeremiah: "JER", jer: "JER",
  lamentations: "LAM", lam: "LAM",
  ezekiel: "EZK", ezek: "EZK", eze: "EZK",
  daniel: "DAN", dan: "DAN",
  hosea: "HOS", hos: "HOS",
  joel: "JOL",
  amos: "AMO",
  obadiah: "OBA", obad: "OBA",
  jonah: "JON",
  micah: "MIC", mic: "MIC",
  nahum: "NAM", nah: "NAM",
  habakkuk: "HAB", hab: "HAB",
  zephaniah: "ZEP", zeph: "ZEP",
  haggai: "HAG", hag: "HAG",
  zechariah: "ZEC", zech: "ZEC",
  malachi: "MAL", mal: "MAL",
  matthew: "MAT", matt: "MAT", mat: "MAT",
  mark: "MRK", mrk: "MRK",
  luke: "LUK", luk: "LUK",
  john: "JHN", jhn: "JHN", jn: "JHN",
  acts: "ACT", act: "ACT",
  romans: "ROM", rom: "ROM",
  "1 corinthians": "1CO", "1corinthians": "1CO", "1 cor": "1CO", "1cor": "1CO",
  "2 corinthians": "2CO", "2corinthians": "2CO", "2 cor": "2CO", "2cor": "2CO",
  galatians: "GAL", gal: "GAL",
  ephesians: "EPH", eph: "EPH",
  philippians: "PHP", phil: "PHP", php: "PHP",
  colossians: "COL", col: "COL",
  "1 thessalonians": "1TH", "1thessalonians": "1TH", "1 thess": "1TH", "1thess": "1TH",
  "2 thessalonians": "2TH", "2thessalonians": "2TH", "2 thess": "2TH", "2thess": "2TH",
  "1 timothy": "1TI", "1timothy": "1TI", "1 tim": "1TI", "1tim": "1TI",
  "2 timothy": "2TI", "2timothy": "2TI", "2 tim": "2TI", "2tim": "2TI",
  titus: "TIT", tit: "TIT",
  philemon: "PHM", phlm: "PHM",
  hebrews: "HEB", heb: "HEB",
  james: "JAS", jas: "JAS",
  "1 peter": "1PE", "1peter": "1PE", "1 pet": "1PE", "1pet": "1PE",
  "2 peter": "2PE", "2peter": "2PE", "2 pet": "2PE", "2pet": "2PE",
  "1 john": "1JN", "1john": "1JN", "1 jn": "1JN",
  "2 john": "2JN", "2john": "2JN", "2 jn": "2JN",
  "3 john": "3JN", "3john": "3JN", "3 jn": "3JN",
  jude: "JUD",
  revelation: "REV", rev: "REV",
};

/**
 * Parse a human-readable verse reference into API.Bible format.
 * E.g., "John 3:16" -> "JHN.3.16", "1 Cor 6:19-20" -> "1CO.6.19-1CO.6.20"
 *
 * @param query The query string to parse.
 * @returns The API.Bible verse ID, or null if not a verse reference.
 */
function parseVerseReference(query: string): string | null {
  // Match patterns like: "John 3:16", "1 Cor 6:19-20", "Psalm 23", "Gen 1:1"
  const match = query.match(
    /^(\d?\s*[a-zA-Z]+(?:\s+of\s+[a-zA-Z]+)?)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/
  );
  if (!match) {
    return null;
  }

  const [, bookName, chapter, verseStart, verseEnd] = match;
  const bookKey = bookName.trim().toLowerCase();
  const bookId = BOOK_IDS[bookKey];
  if (!bookId) {
    return null;
  }

  if (!verseStart) {
    // Chapter only, e.g., "Psalm 23" -> return chapter ID for chapter lookup
    return null;
  }

  if (verseEnd) {
    // Verse range: "John 3:16-17" -> "JHN.3.16-JHN.3.17"
    return `${bookId}.${chapter}.${verseStart}-${bookId}.${chapter}.${verseEnd}`;
  }

  // Single verse: "John 3:16" -> "JHN.3.16"
  return `${bookId}.${chapter}.${verseStart}`;
}

/**
 * Parse a chapter reference from a query.
 * E.g., "Psalm 23" -> "PSA.23", "Genesis 1" -> "GEN.1"
 *
 * @param query The query string.
 * @returns The API.Bible chapter ID, or null.
 */
function parseChapterReference(query: string): string | null {
  const match = query.match(
    /^(\d?\s*[a-zA-Z]+(?:\s+of\s+[a-zA-Z]+)?)\s+(\d+)$/
  );
  if (!match) {
    return null;
  }

  const [, bookName, chapter] = match;
  const bookKey = bookName.trim().toLowerCase();
  const bookId = BOOK_IDS[bookKey];
  if (!bookId) {
    return null;
  }

  return `${bookId}.${chapter}`;
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
   * Smart search that auto-detects verse references vs keyword queries.
   * "John 3:16" uses verse lookup, "healing" uses keyword search,
   * "Psalm 23" fetches the whole chapter.
   *
   * @param query The search query or verse reference.
   * @param translation Bible translation ID (default KJV).
   * @param limit Maximum results for keyword searches.
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

    // Try verse reference first (e.g., "John 3:16", "1 Cor 6:19-20")
    const verseId = parseVerseReference(query);
    if (verseId) {
      const result = await this.getVerse(verseId, translation);
      return result ? [result] : [];
    }

    // Try chapter reference (e.g., "Psalm 23", "Genesis 1")
    const chapterId = parseChapterReference(query);
    if (chapterId) {
      const chapter = await this.getChapter(chapterId, translation);
      if (chapter) {
        return [{ reference: chapter.reference, text: chapter.content }];
      }
      return [];
    }

    // Fall back to keyword search
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
   * Fetch an entire Bible chapter by its ID (e.g., "JHN.3").
   *
   * @param chapterId The chapter ID in API.Bible format (e.g., "GEN.1", "JHN.3").
   * @param translation Bible translation ID.
   * @returns The chapter reference and full text content, or null if not found.
   */
  static async getChapter(
    chapterId: string,
    translation = "de4e12af7f28f599-02"
  ): Promise<{ reference: string; content: string; copyright: string } | null> {
    const apiKey = env.BIBLE_API_KEY;

    if (!apiKey) {
      return null;
    }

    const url = `${BIBLE_API_URL}/bibles/${translation}/chapters/${encodeURIComponent(chapterId)}?content-type=text&include-verse-numbers=true`;

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
    const chapter = data.data;

    return {
      reference: chapter?.reference ?? chapterId,
      content: (chapter?.content ?? "").replace(/<[^>]*>/g, "").trim(),
      copyright: (chapter?.copyright ?? "").replace(/<[^>]*>/g, "").trim(),
    };
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
