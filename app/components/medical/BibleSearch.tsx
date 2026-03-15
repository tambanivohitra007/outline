import { observer } from "mobx-react";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import Flex from "~/components/Flex";
import { client } from "~/utils/ApiClient";
import styled from "styled-components";
import { s } from "@shared/styles";

interface BibleResult {
  reference: string;
  text: string;
}

interface Props {
  /** Called when a verse is selected */
  onSelect: (reference: string, text: string) => void;
  /** Default search query */
  defaultQuery?: string;
}

/**
 * Search component for Bible verses via the API.Bible service.
 * Allows searching by keyword and selecting verses for scripture references.
 */
function BibleSearch({ onSelect, defaultQuery }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(defaultQuery ?? "");
  const [results, setResults] = useState<BibleResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const res = await client.post("/medical.bible.search", {
        query: query.trim(),
        limit: 15,
      });
      const data = res.data ?? [];
      setResults(data);
      if (data.length === 0) {
        setError(t("No verses found. Make sure BIBLE_API_KEY is configured."));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("Bible search failed")
      );
    } finally {
      setIsSearching(false);
    }
  }, [query, t]);

  return (
    <Container>
      <SearchRow>
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void handleSearch();
            }
          }}
          placeholder={t("Search Bible verses\u2026 e.g. \"health\" or \"healing\"")}
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? t("Searching\u2026") : t("Search")}
        </Button>
      </SearchRow>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {results.length > 0 && (
        <ResultsList>
          {results.map((verse, index) => (
            <VerseItem
              key={`${verse.reference}-${index}`}
              onClick={() => onSelect(verse.reference, verse.text)}
            >
              <VerseReference>{verse.reference}</VerseReference>
              <VerseText>{verse.text}</VerseText>
              <SelectHint>{t("Click to add")}</SelectHint>
            </VerseItem>
          ))}
        </ResultsList>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SearchRow = styled(Flex)`
  gap: 8px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${s("accent")};
  }
`;

const ErrorMessage = styled.div`
  font-size: 13px;
  color: #d73a49;
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 400px;
  overflow-y: auto;
`;

const VerseItem = styled.div`
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 100ms ease;

  &:hover {
    background: ${s("listItemHoverBackground")};
  }
`;

const VerseReference = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${s("accent")};
  margin-bottom: 4px;
`;

const VerseText = styled.div`
  font-size: 13px;
  color: ${s("text")};
  line-height: 1.5;
  font-style: italic;
`;

const SelectHint = styled.div`
  font-size: 11px;
  color: ${s("textTertiary")};
  margin-top: 4px;
  opacity: 0;

  ${VerseItem}:hover & {
    opacity: 1;
  }
`;

export default observer(BibleSearch);
