import { observer } from "mobx-react";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import Flex from "~/components/Flex";
import { client } from "~/utils/ApiClient";
import styled from "styled-components";
import { s } from "@shared/styles";

interface ClinicalTrial {
  nctId: string;
  title: string;
  status: string;
  phase: string | null;
  conditions: string[];
  interventions: string[];
  startDate: string | null;
  completionDate: string | null;
}

interface Props {
  /** Default search query (e.g. condition name) */
  defaultQuery?: string;
  /** Called when a trial is selected */
  onSelect?: (trial: ClinicalTrial) => void;
}

/**
 * Search component for ClinicalTrials.gov. Displays trial summaries
 * with status, phase, conditions, and interventions.
 */
function ClinicalTrialSearch({ defaultQuery, onSelect }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(defaultQuery ?? "");
  const [results, setResults] = useState<ClinicalTrial[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      return;
    }
    setIsSearching(true);
    try {
      const res = await client.post("/medical.clinicalTrials.search", {
        query: query.trim(),
        limit: 15,
      });
      setResults(res.data ?? []);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

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
          placeholder={t("Search clinical trials\u2026")}
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? t("Searching\u2026") : t("Search")}
        </Button>
      </SearchRow>

      {results.length > 0 && (
        <ResultsList>
          {results.map((trial) => (
            <TrialItem
              key={trial.nctId}
              onClick={() => onSelect?.(trial)}
              $clickable={!!onSelect}
            >
              <TrialHeader>
                <TrialTitle>{trial.title}</TrialTitle>
                <TrialBadges>
                  <StatusBadge $status={trial.status}>
                    {trial.status}
                  </StatusBadge>
                  {trial.phase && <PhaseBadge>{trial.phase}</PhaseBadge>}
                </TrialBadges>
              </TrialHeader>
              <TrialMeta>
                <NctId
                  href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {trial.nctId}
                </NctId>
                {trial.startDate && (
                  <MetaItem>{t("Start")}: {trial.startDate}</MetaItem>
                )}
                {trial.completionDate && (
                  <MetaItem>{t("End")}: {trial.completionDate}</MetaItem>
                )}
              </TrialMeta>
              {trial.conditions.length > 0 && (
                <TagRow>
                  <TagLabel>{t("Conditions")}:</TagLabel>
                  {trial.conditions.slice(0, 3).map((c, i) => (
                    <Tag key={i} $type="condition">{c}</Tag>
                  ))}
                  {trial.conditions.length > 3 && (
                    <TagMore>+{trial.conditions.length - 3}</TagMore>
                  )}
                </TagRow>
              )}
              {trial.interventions.length > 0 && (
                <TagRow>
                  <TagLabel>{t("Interventions")}:</TagLabel>
                  {trial.interventions.slice(0, 3).map((iv, i) => (
                    <Tag key={i} $type="intervention">{iv}</Tag>
                  ))}
                  {trial.interventions.length > 3 && (
                    <TagMore>+{trial.interventions.length - 3}</TagMore>
                  )}
                </TagRow>
              )}
            </TrialItem>
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

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 500px;
  overflow-y: auto;
`;

const TrialItem = styled.div<{ $clickable: boolean }>`
  padding: 12px;
  border-radius: 6px;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};

  &:hover {
    background: ${s("listItemHoverBackground")};
  }
`;

const TrialHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
`;

const TrialTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${s("text")};
  line-height: 1.3;
  flex: 1;
`;

const TrialBadges = styled(Flex)`
  gap: 4px;
  flex-shrink: 0;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
  background: ${(props) => {
    const s = props.$status.toLowerCase();
    if (s.includes("recruiting")) { return "#d4edda"; }
    if (s.includes("completed")) { return "#cce5ff"; }
    if (s.includes("terminated") || s.includes("withdrawn")) { return "#f8d7da"; }
    return "#e2e8f0";
  }};
  color: ${(props) => {
    const s = props.$status.toLowerCase();
    if (s.includes("recruiting")) { return "#155724"; }
    if (s.includes("completed")) { return "#004085"; }
    if (s.includes("terminated") || s.includes("withdrawn")) { return "#721c24"; }
    return "#4a5568";
  }};
`;

const PhaseBadge = styled.span`
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 3px;
  background: ${s("backgroundSecondary")};
  color: ${s("textSecondary")};
  white-space: nowrap;
`;

const TrialMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: ${s("textTertiary")};
  margin-bottom: 6px;
`;

const NctId = styled.a`
  font-family: monospace;
  color: ${s("accent")};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const MetaItem = styled.span``;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin-top: 4px;
`;

const TagLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${s("textTertiary")};
`;

const Tag = styled.span<{ $type: string }>`
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  background: ${(props) =>
    props.$type === "condition" ? "#fef3cd" : "#d1ecf1"};
  color: ${(props) =>
    props.$type === "condition" ? "#856404" : "#0c5460"};
`;

const TagMore = styled.span`
  font-size: 11px;
  color: ${s("textTertiary")};
`;

export default observer(ClinicalTrialSearch);
