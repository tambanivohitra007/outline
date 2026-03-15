import { CloseIcon } from "outline-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { keyframes } from "styled-components";
import { s } from "@shared/styles";
import { client } from "~/utils/ApiClient";

/** Map of common book names to API.Bible book IDs. */
const BOOK_IDS: Record<string, string> = {
  genesis: "GEN", gen: "GEN",
  exodus: "EXO", exo: "EXO", ex: "EXO",
  leviticus: "LEV", lev: "LEV",
  numbers: "NUM", num: "NUM",
  deuteronomy: "DEU", deut: "DEU", deu: "DEU",
  joshua: "JOS", josh: "JOS",
  judges: "JDG", judg: "JDG",
  ruth: "RUT",
  "1 samuel": "1SA", "1 sam": "1SA", "1samuel": "1SA",
  "2 samuel": "2SA", "2 sam": "2SA", "2samuel": "2SA",
  "1 kings": "1KI", "1 kgs": "1KI", "1kings": "1KI",
  "2 kings": "2KI", "2 kgs": "2KI", "2kings": "2KI",
  "1 chronicles": "1CH", "1 chr": "1CH", "1chronicles": "1CH",
  "2 chronicles": "2CH", "2 chr": "2CH", "2chronicles": "2CH",
  ezra: "EZR",
  nehemiah: "NEH", neh: "NEH",
  esther: "EST",
  job: "JOB",
  psalms: "PSA", psalm: "PSA", ps: "PSA", psa: "PSA",
  proverbs: "PRO", prov: "PRO", pro: "PRO",
  ecclesiastes: "ECC", eccl: "ECC",
  "song of solomon": "SNG", "song of songs": "SNG", song: "SNG",
  isaiah: "ISA", isa: "ISA",
  jeremiah: "JER", jer: "JER",
  lamentations: "LAM", lam: "LAM",
  ezekiel: "EZK", ezek: "EZK",
  daniel: "DAN", dan: "DAN",
  hosea: "HOS", hos: "HOS",
  joel: "JOL",
  amos: "AMO",
  obadiah: "OBA",
  jonah: "JON",
  micah: "MIC", mic: "MIC",
  nahum: "NAM",
  habakkuk: "HAB", hab: "HAB",
  zephaniah: "ZEP", zeph: "ZEP",
  haggai: "HAG", hag: "HAG",
  zechariah: "ZEC", zech: "ZEC",
  malachi: "MAL", mal: "MAL",
  matthew: "MAT", matt: "MAT", mt: "MAT",
  mark: "MRK", mk: "MRK",
  luke: "LUK", lk: "LUK",
  john: "JHN", jn: "JHN", jhn: "JHN",
  acts: "ACT",
  romans: "ROM", rom: "ROM",
  "1 corinthians": "1CO", "1 cor": "1CO", "1corinthians": "1CO",
  "2 corinthians": "2CO", "2 cor": "2CO", "2corinthians": "2CO",
  galatians: "GAL", gal: "GAL",
  ephesians: "EPH", eph: "EPH",
  philippians: "PHP", phil: "PHP",
  colossians: "COL", col: "COL",
  "1 thessalonians": "1TH", "1 thess": "1TH", "1thessalonians": "1TH",
  "2 thessalonians": "2TH", "2 thess": "2TH", "2thessalonians": "2TH",
  "1 timothy": "1TI", "1 tim": "1TI", "1timothy": "1TI",
  "2 timothy": "2TI", "2 tim": "2TI", "2timothy": "2TI",
  titus: "TIT",
  philemon: "PHM",
  hebrews: "HEB", heb: "HEB",
  james: "JAS", jas: "JAS",
  "1 peter": "1PE", "1 pet": "1PE", "1peter": "1PE",
  "2 peter": "2PE", "2 pet": "2PE", "2peter": "2PE",
  "1 john": "1JN", "1john": "1JN",
  "2 john": "2JN", "2john": "2JN",
  "3 john": "3JN", "3john": "3JN",
  jude: "JUD",
  revelation: "REV", rev: "REV",
};

/**
 * Parse a human-readable Bible reference into an API.Bible chapter ID.
 * Examples: "John 3:16" → "JHN.3", "Genesis 1" → "GEN.1", "Psalm 23:1-6" → "PSA.23"
 *
 * @param reference Human-readable reference string.
 * @returns Chapter ID in API.Bible format or null if parsing fails.
 */
function parseChapterId(reference: string): string | null {
  const cleaned = reference.trim();
  // Match: optional number prefix + book name, then chapter:verse(s)
  const match = cleaned.match(
    /^(\d?\s*[a-zA-Z]+(?:\s+of\s+[a-zA-Z]+)?)\s+(\d+)(?:[:\s]\d+)?/i
  );
  if (!match) {
    return null;
  }

  const bookRaw = match[1].trim().toLowerCase();
  const chapter = match[2];
  const bookId = BOOK_IDS[bookRaw];

  if (!bookId) {
    return null;
  }

  return `${bookId}.${chapter}`;
}

interface ChapterContent {
  reference: string;
  content: string;
  copyright: string;
}

interface EgwContent {
  paragraphs: Array<{ paraId: string; text: string; refcode: string }>;
  title: string;
}

interface Props {
  /** The scripture reference to read (e.g., "John 3:16" or "MH p.127"). */
  reference: string;
  /** Whether this is a Spirit of Prophecy reference. */
  isSpiritOfProphecy: boolean;
  /** SoP source book name if applicable. */
  sopSource?: string;
  /** EGW book ID if known. */
  egwBookId?: number;
  /** EGW paragraph ID if known. */
  egwParaId?: string;
  /** Called when the reader should close. */
  onClose: () => void;
}

/**
 * Full-chapter reader panel for Bible and Spirit of Prophecy content.
 * Slides in from the right as an overlay panel.
 *
 * @param props Component props.
 */
function ChapterReader({
  reference,
  isSpiritOfProphecy,
  sopSource,
  egwBookId,
  egwParaId,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [bibleContent, setBibleContent] = useState<ChapterContent | null>(null);
  const [egwContent, setEgwContent] = useState<EgwContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        if (isSpiritOfProphecy) {
          // For SoP: if we have bookId and paraId, fetch content directly
          if (egwBookId && egwParaId) {
            const res = await client.post("/medical.egw.content", {
              bookId: egwBookId,
              paraId: egwParaId,
            });
            setEgwContent({
              paragraphs: res.data ?? [],
              title: sopSource ?? reference,
            });
          } else {
            // Search by reference text to find the content
            const res = await client.post("/medical.egw.search", {
              query: reference,
              limit: 1,
            });
            const hit = res.data?.[0];
            if (hit?.bookId && hit?.paraId) {
              const contentRes = await client.post("/medical.egw.content", {
                bookId: hit.bookId,
                paraId: hit.paraId,
              });
              setEgwContent({
                paragraphs: contentRes.data ?? [],
                title: hit.bookTitle || sopSource || reference,
              });
            } else {
              setError(
                t(
                  "Could not find this Spirit of Prophecy reference. Make sure EGW API credentials are configured."
                )
              );
            }
          }
        } else {
          // Bible chapter
          const chapterId = parseChapterId(reference);
          if (!chapterId) {
            setError(
              t(
                "Could not parse chapter from reference \"{{reference}}\". Expected format: Book Chapter:Verse",
                { reference }
              )
            );
            return;
          }

          const res = await client.post("/medical.bible.chapter", {
            chapterId,
          });

          if (res.data) {
            setBibleContent(res.data);
          } else {
            setError(
              t(
                "Chapter not found. Make sure BIBLE_API_KEY is configured in your environment."
              )
            );
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("Failed to load content.")
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [reference, isSpiritOfProphecy, egwBookId, egwParaId, sopSource, t]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <Overlay onClick={handleOverlayClick}>
      <Panel>
        <PanelHeader>
          <HeaderLeft>
            <TypeBadge $sop={isSpiritOfProphecy}>
              {isSpiritOfProphecy ? t("Spirit of Prophecy") : t("Bible")}
            </TypeBadge>
            <PanelTitle>
              {isSpiritOfProphecy
                ? egwContent?.title ?? sopSource ?? reference
                : bibleContent?.reference ?? reference}
            </PanelTitle>
          </HeaderLeft>
          <CloseButton onClick={onClose} title={t("Close")}>
            <CloseIcon />
          </CloseButton>
        </PanelHeader>

        <PanelBody>
          {isLoading && <LoadingText>{t("Loading")}...</LoadingText>}

          {error && <ErrorText>{error}</ErrorText>}

          {!isLoading && !error && bibleContent && (
            <>
              <ChapterText>{bibleContent.content}</ChapterText>
              {bibleContent.copyright && (
                <Copyright>{bibleContent.copyright}</Copyright>
              )}
            </>
          )}

          {!isLoading && !error && egwContent && (
            <>
              {egwContent.paragraphs.map((p, i) => (
                <Paragraph key={p.paraId || i}>
                  {p.refcode && <RefCode>{p.refcode}</RefCode>}
                  {p.text}
                </Paragraph>
              ))}
              {egwContent.paragraphs.length === 0 && (
                <EmptyText>{t("No content available.")}</EmptyText>
              )}
            </>
          )}
        </PanelBody>
      </Panel>
    </Overlay>
  );
}

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 150ms ease;
`;

const Panel = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 520px;
  max-width: 100%;
  background: ${s("background")};
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  animation: ${slideIn} 200ms ease-out;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${s("divider")};
  flex-shrink: 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const TypeBadge = styled.span<{ $sop: boolean }>`
  display: inline-block;
  padding: 2px 10px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 10px;
  width: fit-content;
  background: ${(props) => (props.$sop ? "#7c3aed" : "#2563eb")};
  color: white;
`;

const PanelTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${s("text")};
  margin: 0;
  line-height: 1.3;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${s("textTertiary")};
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: ${s("backgroundSecondary")};
    color: ${s("text")};
  }
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const ChapterText = styled.div`
  font-size: 15px;
  line-height: 1.8;
  color: ${s("text")};
  white-space: pre-wrap;
`;

const Paragraph = styled.p`
  font-size: 15px;
  line-height: 1.8;
  color: ${s("text")};
  margin: 0 0 16px;
`;

const RefCode = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: ${s("textTertiary")};
  margin-right: 8px;
  vertical-align: super;
`;

const Copyright = styled.div`
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid ${s("divider")};
  font-size: 11px;
  color: ${s("textTertiary")};
  line-height: 1.5;
`;

const LoadingText = styled.div`
  font-size: 14px;
  color: ${s("textTertiary")};
  padding: 40px 0;
  text-align: center;
`;

const ErrorText = styled.div`
  font-size: 13px;
  color: #e63950;
  padding: 20px;
  background: rgba(230, 57, 80, 0.06);
  border-radius: 8px;
  line-height: 1.5;
`;

const EmptyText = styled.div`
  font-size: 14px;
  color: ${s("textTertiary")};
  text-align: center;
  padding: 40px 0;
`;

export default ChapterReader;
