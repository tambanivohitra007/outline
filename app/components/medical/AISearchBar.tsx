import { observer } from "mobx-react";
import { SearchIcon } from "outline-icons";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Flex from "~/components/Flex";
import { client } from "~/utils/ApiClient";
import styled from "styled-components";
import { s } from "@shared/styles";

interface SearchResult {
  intent: string;
  conditions: Array<{ id: string; name: string; status: string; snomedCode?: string }>;
  interventions: Array<{ id: string; name: string; category?: string }>;
  recipes: Array<{ id: string; name: string; description?: string }>;
}

/**
 * AI-powered search bar that uses Gemini to interpret natural language queries
 * and search across conditions, interventions, and recipes.
 */
function AISearchBar() {
  const { t } = useTranslation();
  const history = useHistory();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      return;
    }
    setIsSearching(true);
    setError(null);
    setResults(null);
    try {
      const res = await client.post("/ai.search", { query: query.trim() });
      setResults(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("Search failed")
      );
    } finally {
      setIsSearching(false);
    }
  }, [query, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        void handleSearch();
      }
    },
    [handleSearch]
  );

  const totalResults =
    (results?.conditions.length ?? 0) +
    (results?.interventions.length ?? 0) +
    (results?.recipes.length ?? 0);

  return (
    <Container>
      <SearchRow>
        <SearchInputWrapper>
          <SearchIconStyled>
            <SearchIcon size={18} />
          </SearchIconStyled>
          <SearchInput
            placeholder={t("Ask anything\u2026 e.g. \"What treatments help with diabetes?\"")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </SearchInputWrapper>
        <SearchButton onClick={handleSearch} disabled={isSearching || !query.trim()}>
          {isSearching ? t("Searching\u2026") : t("AI Search")}
        </SearchButton>
      </SearchRow>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {results && (
        <ResultsPanel>
          {results.intent && (
            <IntentRow>{results.intent}</IntentRow>
          )}

          {totalResults === 0 ? (
            <EmptyResult>{t("No results found. Try a different query.")}</EmptyResult>
          ) : (
            <>
              {results.conditions.length > 0 && (
                <ResultSection>
                  <ResultSectionTitle>{t("Conditions")}</ResultSectionTitle>
                  {results.conditions.map((c) => (
                    <ResultItem
                      key={c.id}
                      onClick={() => history.push(`/condition/${c.id}`)}
                    >
                      <ResultName>{c.name}</ResultName>
                      <ResultMeta>
                        <StatusTag $status={c.status}>{c.status}</StatusTag>
                        {c.snomedCode && <CodeTag>{c.snomedCode}</CodeTag>}
                      </ResultMeta>
                    </ResultItem>
                  ))}
                </ResultSection>
              )}

              {results.interventions.length > 0 && (
                <ResultSection>
                  <ResultSectionTitle>{t("Interventions")}</ResultSectionTitle>
                  {results.interventions.map((i) => (
                    <ResultItem
                      key={i.id}
                      onClick={() => history.push("/interventions")}
                    >
                      <ResultName>{i.name}</ResultName>
                      {i.category && <ResultMeta>{i.category}</ResultMeta>}
                    </ResultItem>
                  ))}
                </ResultSection>
              )}

              {results.recipes.length > 0 && (
                <ResultSection>
                  <ResultSectionTitle>{t("Recipes")}</ResultSectionTitle>
                  {results.recipes.map((r) => (
                    <ResultItem
                      key={r.id}
                      onClick={() => history.push("/recipes")}
                    >
                      <ResultName>{r.name}</ResultName>
                      {r.description && (
                        <ResultDescription>
                          {r.description.slice(0, 100)}
                          {r.description.length > 100 ? "\u2026" : ""}
                        </ResultDescription>
                      )}
                    </ResultItem>
                  ))}
                </ResultSection>
              )}
            </>
          )}
        </ResultsPanel>
      )}
    </Container>
  );
}

const Container = styled.div`
  margin-bottom: 16px;
`;

const SearchRow = styled(Flex)`
  gap: 8px;
  align-items: stretch;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  flex: 1;
`;

const SearchIconStyled = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${s("textTertiary")};
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 14px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: ${s("accent")};
    box-shadow: 0 0 0 1px ${s("accent")};
  }

  &::placeholder {
    color: ${s("textTertiary")};
  }
`;

const SearchButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: ${s("accent")};
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 100ms ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: #d73a49;
`;

const ResultsPanel = styled.div`
  margin-top: 12px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  overflow: hidden;
`;

const IntentRow = styled.div`
  padding: 10px 16px;
  font-size: 13px;
  color: ${s("accent")};
  font-style: italic;
  background: ${s("backgroundSecondary")};
  border-bottom: 1px solid ${s("divider")};
`;

const EmptyResult = styled.div`
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: ${s("textTertiary")};
`;

const ResultSection = styled.div`
  &:not(:last-child) {
    border-bottom: 1px solid ${s("divider")};
  }
`;

const ResultSectionTitle = styled.div`
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${s("textTertiary")};
  background: ${s("backgroundSecondary")};
`;

const ResultItem = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  transition: background 100ms ease;

  &:hover {
    background: ${s("listItemHoverBackground")};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${s("divider")};
  }
`;

const ResultName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${s("text")};
`;

const ResultMeta = styled(Flex)`
  gap: 6px;
  margin-top: 4px;
  align-items: center;
`;

const ResultDescription = styled.div`
  font-size: 12px;
  color: ${s("textSecondary")};
  margin-top: 2px;
`;

const StatusTag = styled.span<{ $status: string }>`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  background: ${(props) =>
    props.$status === "published"
      ? "#d4edda"
      : props.$status === "review"
        ? "#fff3cd"
        : "#e2e8f0"};
  color: ${(props) =>
    props.$status === "published"
      ? "#155724"
      : props.$status === "review"
        ? "#856404"
        : "#4a5568"};
`;

const CodeTag = styled.span`
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  background: ${s("backgroundSecondary")};
  color: ${s("textSecondary")};
  font-family: monospace;
`;

export default observer(AISearchBar);
