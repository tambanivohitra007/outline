import { observer } from "mobx-react";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import Flex from "~/components/Flex";
import { client } from "~/utils/ApiClient";
import styled from "styled-components";
import { s } from "@shared/styles";

interface PubMedResult {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
}

interface Props {
  /** Condition ID to link imported evidence to */
  conditionId?: string;
  /** Intervention ID to link imported evidence to */
  interventionId?: string;
  /** Called after successful import */
  onImport?: () => void;
}

function PubMedSearch({ conditionId, interventionId, onImport }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PubMedResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const res = await client.post("/medical.pubmed.search", {
        query: query.trim(),
        limit: 20,
      });
      setResults(res.data ?? []);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleImport = useCallback(
    async (pmid: string) => {
      setImportingId(pmid);
      try {
        await client.post("/medical.pubmed.import", {
          pmid,
          conditionId,
          interventionId,
        });
        onImport?.();
      } finally {
        setImportingId(null);
      }
    },
    [conditionId, interventionId, onImport]
  );

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
          placeholder={t("Search PubMed articles...")}
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? t("Searching...") : t("Search")}
        </Button>
      </SearchRow>

      {results.length > 0 && (
        <ResultsList>
          {results.map((result) => (
            <ResultItem key={result.pmid}>
              <ResultInfo>
                <ResultTitle>{result.title}</ResultTitle>
                <ResultMeta>
                  {result.authors && <Authors>{result.authors}</Authors>}
                  {result.journal && <Journal>{result.journal}</Journal>}
                  <PMID>PMID: {result.pmid}</PMID>
                </ResultMeta>
              </ResultInfo>
              <Button
                onClick={() => handleImport(result.pmid)}
                disabled={importingId === result.pmid}
                neutral
              >
                {importingId === result.pmid ? t("Importing...") : t("Import")}
              </Button>
            </ResultItem>
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

  &:focus {
    outline: none;
    border-color: ${s("accent")};
  }
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 400px;
  overflow-y: auto;
`;

const ResultItem = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;

  &:hover {
    background: ${s("listItemHoverBackground")};
  }
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${s("text")};
  line-height: 1.3;
  margin-bottom: 4px;
`;

const ResultMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: ${s("textTertiary")};
`;

const Authors = styled.span`
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Journal = styled.span`
  font-style: italic;
`;

const PMID = styled.span`
  font-family: monospace;
`;

export default observer(PubMedSearch);
