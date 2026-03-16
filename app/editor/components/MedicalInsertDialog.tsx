import { CloseIcon } from "outline-icons";
import MarkdownIt from "markdown-it";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { keyframes } from "styled-components";
import { s } from "@shared/styles";
import { client } from "~/utils/ApiClient";

const md = new MarkdownIt({ linkify: true, typographer: true });

type InsertMode = "bible" | "egw" | "ai";

interface BibleResult {
  reference: string;
  text: string;
}

interface EgwResult {
  reference: string;
  text: string;
  bookTitle: string;
  bookId: number;
  paraId: string;
}

interface Props {
  /** Which insert mode to use. */
  mode: InsertMode;
  /** The document title, used as context for AI suggestions. */
  documentTitle: string;
  /** Called with the formatted text to insert into the editor. */
  onInsert: (text: string) => void;
  /** Called when the dialog should close without inserting. */
  onClose: () => void;
}

/**
 * Dialog for searching and inserting Bible verses, EGW quotes,
 * or AI-generated explanations into the editor.
 *
 * @param props Component props.
 */
function MedicalInsertDialog({
  mode,
  documentTitle,
  onInsert,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BibleResult[] | EgwResult[]>([]);
  const [aiText, setAiText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === "ai") {
      textareaRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [mode]);

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

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      if (mode === "bible") {
        const res = await client.post("/medical.bible.search", {
          query: query.trim(),
          limit: 10,
        });
        setResults(res.data ?? []);
      } else if (mode === "egw") {
        const res = await client.post("/medical.egw.search", {
          query: query.trim(),
          limit: 10,
        });
        setResults(res.data ?? []);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("Search failed.")
      );
    } finally {
      setIsLoading(false);
    }
  }, [query, mode, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void handleSearch();
      }
    },
    [handleSearch]
  );

  const handleSelectBible = useCallback(
    (result: BibleResult) => {
      const text = `> **${result.reference}**\n> ${result.text}\n`;
      onInsert(text);
    },
    [onInsert]
  );

  const handleSelectEgw = useCallback(
    (result: EgwResult) => {
      const source = result.bookTitle
        ? ` — *${result.bookTitle}*`
        : "";
      const text = `> ${result.text}\n>\n> — **${result.reference}**${source}\n`;
      onInsert(text);
    },
    [onInsert]
  );

  const handleAIGenerate = useCallback(async () => {
    const prompt = query.trim() || documentTitle;
    if (!prompt) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setAiText("");

    try {
      const res = await client.post("/ai.explain", {
        topic: prompt,
        context: documentTitle || undefined,
      });
      setAiText(res.data?.text ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("AI generation failed.")
      );
    } finally {
      setIsLoading(false);
    }
  }, [query, documentTitle, t]);

  const handleInsertAI = useCallback(() => {
    if (aiText) {
      onInsert(aiText + "\n");
    }
  }, [aiText, onInsert]);

  const aiHtml = useMemo(() => (aiText ? md.render(aiText) : ""), [aiText]);

  const title =
    mode === "bible"
      ? t("Insert Bible verse")
      : mode === "egw"
        ? t("Insert Spirit of Prophecy quote")
        : t("AI explanation");

  const placeholder =
    mode === "bible"
      ? t("Search by reference or keyword (e.g., John 3:16, healing)")
      : mode === "egw"
        ? t("Search EGW writings (e.g., health reform, temperance)")
        : t("Describe what you need explained, or leave empty to use document title");

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Dialog>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose onClick={onClose} title={t("Close")}>
            <CloseIcon />
          </DialogClose>
        </DialogHeader>

        <SearchRow>
          {mode === "ai" ? (
            <SearchTextarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              rows={2}
            />
          ) : (
            <SearchInput
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
            />
          )}
          <SearchButton
            onClick={mode === "ai" ? handleAIGenerate : handleSearch}
            disabled={isLoading}
          >
            {isLoading
              ? t("Loading...")
              : mode === "ai"
                ? t("Generate")
                : t("Search")}
          </SearchButton>
        </SearchRow>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <ResultsArea>
          {mode === "bible" &&
            (results as BibleResult[]).map((r, i) => (
              <ResultItem key={i} onClick={() => handleSelectBible(r)}>
                <ResultRef>{r.reference}</ResultRef>
                <ResultText>{r.text}</ResultText>
              </ResultItem>
            ))}

          {mode === "egw" &&
            (results as EgwResult[]).map((r, i) => (
              <ResultItem key={i} onClick={() => handleSelectEgw(r)}>
                <ResultRef>
                  {r.reference}
                  {r.bookTitle && (
                    <ResultBook> — {r.bookTitle}</ResultBook>
                  )}
                </ResultRef>
                <ResultText>{r.text}</ResultText>
              </ResultItem>
            ))}

          {mode === "ai" && aiText && (
            <AIResultArea>
              <AIResultText dangerouslySetInnerHTML={{ __html: aiHtml }} />
            </AIResultArea>
          )}

          {!isLoading &&
            !error &&
            mode !== "ai" &&
            results.length === 0 &&
            query && (
              <EmptyMessage>{t("No results found.")}</EmptyMessage>
            )}
        </ResultsArea>

        {mode === "ai" && aiText && (
          <StickyFooter>
            <AIInsertButton onClick={handleInsertAI}>
              {t("Insert into document")}
            </AIInsertButton>
          </StickyFooter>
        )}
      </Dialog>
    </Overlay>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 100ms ease;
`;

const Dialog = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 560px;
  max-width: 92vw;
  max-height: 80vh;
  background: ${s("background")};
  border: 1px solid ${s("divider")};
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: ${scaleIn} 150ms ease;
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
`;

const DialogTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: ${s("text")};
  margin: 0;
`;

const DialogClose = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${s("textTertiary")};
  cursor: pointer;

  &:hover {
    background: ${s("backgroundSecondary")};
    color: ${s("text")};
  }
`;

const SearchRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 20px 12px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  background: ${s("background")};
  color: ${s("text")};
  outline: none;

  &:focus {
    border-color: ${s("accent")};
  }

  &::placeholder {
    color: ${s("textTertiary")};
  }
`;

const SearchTextarea = styled.textarea`
  flex: 1;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  background: ${s("background")};
  color: ${s("text")};
  outline: none;
  resize: none;
  font-family: inherit;

  &:focus {
    border-color: ${s("accent")};
  }

  &::placeholder {
    color: ${s("textTertiary")};
  }
`;

const SearchButton = styled.button`
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: ${s("accent")};
  color: white;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 100ms ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const ResultsArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 16px;
  min-height: 80px;
  max-height: 400px;
`;

const ResultItem = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 100ms ease;

  & + & {
    margin-top: 2px;
  }

  &:hover {
    background: ${s("backgroundSecondary")};
  }
`;

const ResultRef = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${s("accent")};
  margin-bottom: 4px;
`;

const ResultBook = styled.span`
  font-weight: 400;
  color: ${s("textTertiary")};
`;

const ResultText = styled.div`
  font-size: 13px;
  color: ${s("text")};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const AIResultArea = styled.div`
  padding: 12px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  background: ${s("backgroundSecondary")};
`;

const AIResultText = styled.div`
  font-size: 14px;
  color: ${s("text")};
  line-height: 1.7;

  h1, h2, h3, h4, h5, h6 {
    margin: 12px 0 6px;
    font-weight: 600;
    color: ${s("text")};
  }

  h1 { font-size: 1.3em; }
  h2 { font-size: 1.15em; }
  h3 { font-size: 1.05em; }

  p {
    margin: 0 0 8px;
  }

  ul, ol {
    margin: 0 0 8px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  strong {
    font-weight: 600;
  }

  code {
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.9em;
    background: ${s("codeBackground")};
  }

  blockquote {
    margin: 8px 0;
    padding: 4px 12px;
    border-left: 3px solid ${s("accent")};
    color: ${s("textSecondary")};
  }

  a {
    color: ${s("accent")};
    text-decoration: underline;
  }
`;

const StickyFooter = styled.div`
  flex-shrink: 0;
  padding: 12px 20px;
  border-top: 1px solid ${s("divider")};
  background: ${s("background")};
  border-radius: 0 0 12px 12px;
`;

const AIInsertButton = styled.button`
  display: block;
  width: 100%;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: ${s("accent")};
  color: white;
  cursor: pointer;
  transition: opacity 100ms ease;

  &:hover {
    opacity: 0.9;
  }
`;

const ErrorMessage = styled.div`
  margin: 0 20px 12px;
  padding: 8px 12px;
  font-size: 13px;
  color: #e63950;
  background: rgba(230, 57, 80, 0.06);
  border-radius: 8px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
  color: ${s("textTertiary")};
`;

export default MedicalInsertDialog;
