import { observer } from "mobx-react";
import { SearchIcon } from "outline-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";
import { transparentize } from "polished";
import { s } from "@shared/styles";
import Flex from "~/components/Flex";
import Scene from "~/components/Scene";
import { client } from "~/utils/ApiClient";
import { conditionPath, conditionsPath } from "~/utils/routeHelpers";

interface SearchResult {
  conditions: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
  }>;
  interventions: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  recipes: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

const CATEGORIES = [
  { key: "conditions", label: "Conditions", icon: "♡" },
  { key: "interventions", label: "Interventions", icon: "⚡" },
  { key: "care_domains", label: "Care Domains", icon: "☐" },
  { key: "scriptures", label: "Scriptures", icon: "☰" },
  { key: "egw", label: "EGW Writings", icon: "☷" },
  { key: "recipes", label: "Recipes", icon: "⚘" },
  { key: "evidence", label: "Evidence", icon: "⊞" },
  { key: "references", label: "References", icon: "⊟" },
  { key: "sections", label: "Sections", icon: "☰" },
  { key: "tags", label: "Tags", icon: "⚑" },
  { key: "protocols", label: "Protocols", icon: "⊞" },
  { key: "body_systems", label: "Body Systems", icon: "⚙" },
] as const;

function Search() {
  const { t } = useTranslation();
  const history = useHistory();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(
    null
  );
  const [selectedIndex, setSelectedIndex] = React.useState(-1);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setSelectedIndex(-1);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await client.post("/ai.search", { query: query.trim() });
        setResults(res.data);
      } catch {
        // Silently ignore search errors
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const flatResults = React.useMemo(() => {
    if (!results) {
      return [];
    }
    const items: Array<{
      type: string;
      id: string;
      name: string;
      slug?: string;
      status?: string;
    }> = [];
    for (const c of results.conditions) {
      if (!activeCategory || activeCategory === "conditions") {
        items.push({ type: "condition", ...c });
      }
    }
    for (const i of results.interventions) {
      if (!activeCategory || activeCategory === "interventions") {
        items.push({ type: "intervention", ...i });
      }
    }
    for (const r of results.recipes) {
      if (!activeCategory || activeCategory === "recipes") {
        items.push({ type: "recipe", ...r });
      }
    }
    return items;
  }, [results, activeCategory]);

  const handleNavigate = React.useCallback(
    (item: (typeof flatResults)[0]) => {
      if (item.type === "condition") {
        history.push(conditionPath(item.id));
      } else if (item.type === "intervention") {
        history.push(`/interventions`);
      } else if (item.type === "recipe") {
        history.push(`/recipes`);
      }
    },
    [history]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < flatResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleNavigate(flatResults[selectedIndex]);
    } else if (e.key === "Escape") {
      if (query) {
        setQuery("");
      } else {
        history.goBack();
      }
    }
  };

  const hasResults = flatResults.length > 0;
  const showEmpty = !isSearching && !hasResults;

  return (
    <Scene textTitle={t("Search")}>
      <PageWrapper>
        <Header>
          <Badge>
            <BadgeIcon>✦</BadgeIcon>
            {t("Instant Search")}
          </Badge>
          <Title>{t("Search the Knowledge Platform")}</Title>
          <Subtitle>
            {t(
              "Find conditions, interventions, scriptures, recipes, and more"
            )}
          </Subtitle>
        </Header>

        <SearchCard>
          <SearchInputWrapper>
            <StyledSearchIcon size={20} />
            <StyledInput
              ref={inputRef}
              type="text"
              placeholder={t("Type to search...")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
            />
            <KeyHints>
              <KeyHint>↑</KeyHint>
              <KeyHint>↓</KeyHint>
              <KeyHintLabel>{t("to navigate")}</KeyHintLabel>
              <KeyHint>↵</KeyHint>
              <KeyHintLabel>{t("to select")}</KeyHintLabel>
            </KeyHints>
          </SearchInputWrapper>

          <CategoryChips>
            {CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.key}
                $active={activeCategory === cat.key}
                onClick={() =>
                  setActiveCategory(
                    activeCategory === cat.key ? null : cat.key
                  )
                }
              >
                <ChipIcon>{cat.icon}</ChipIcon>
                {t(cat.label)}
              </CategoryChip>
            ))}
          </CategoryChips>
        </SearchCard>

        <ResultsCard>
          {isSearching && (
            <EmptyState>
              <EmptyIcon>⟳</EmptyIcon>
              <EmptyTitle>{t("Searching")}...</EmptyTitle>
            </EmptyState>
          )}

          {!query && showEmpty && (
            <EmptyState>
              <EmptyIconCircle>
                <EmptyBolt>⚡</EmptyBolt>
              </EmptyIconCircle>
              <EmptyTitle>{t("Start typing to search")}</EmptyTitle>
              <EmptySubtitle>
                {t(
                  "Search across conditions, interventions, scriptures, recipes, evidence, and references instantly."
                )}
              </EmptySubtitle>
            </EmptyState>
          )}

          {query && showEmpty && !isSearching && (
            <EmptyState>
              <EmptyTitle>{t("No results found")}</EmptyTitle>
              <EmptySubtitle>
                {t("Try a different search term or category filter.")}
              </EmptySubtitle>
            </EmptyState>
          )}

          {hasResults && (
            <ResultsList>
              {flatResults.map((item, index) => (
                <ResultItem
                  key={`${item.type}-${item.id}`}
                  $selected={index === selectedIndex}
                  onClick={() => handleNavigate(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <ResultTypeIcon $type={item.type}>
                    {item.type === "condition"
                      ? "♡"
                      : item.type === "intervention"
                        ? "⚡"
                        : "⚘"}
                  </ResultTypeIcon>
                  <ResultInfo>
                    <ResultName>{item.name}</ResultName>
                    <ResultType>{item.type}</ResultType>
                  </ResultInfo>
                  {item.status && (
                    <ResultStatus $status={item.status}>
                      {item.status}
                    </ResultStatus>
                  )}
                </ResultItem>
              ))}
            </ResultsList>
          )}
        </ResultsCard>

        <FooterHints>
          <FooterHint>
            <FooterKey>Esc</FooterKey>
            <span>{t("to clear")}</span>
          </FooterHint>
          <FooterHint>
            <FooterKey>↑</FooterKey>
            <FooterKey>↓</FooterKey>
            <span>{t("to navigate")}</span>
          </FooterHint>
          <FooterHint>
            <FooterKey>↵</FooterKey>
            <span>{t("to open")}</span>
          </FooterHint>
        </FooterHints>
      </PageWrapper>
    </Scene>
  );
}

const PageWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0 40px;
  width: 100%;

  ${breakpoint("tablet")`
    padding: 40px 0 60px;
  `};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  background: #fef2f2;
  color: #e63950;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const BadgeIcon = styled.span`
  font-size: 14px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${s("text")};
  margin: 0 0 8px;

  ${breakpoint("tablet")`
    font-size: 36px;
  `};
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: ${s("textTertiary")};
  margin: 0;
`;

const SearchCard = styled.div`
  background: ${s("background")};
  border: 1px solid ${s("inputBorder")};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const StyledSearchIcon = styled(SearchIcon)`
  position: absolute;
  left: 16px;
  color: ${s("textTertiary")};
  pointer-events: none;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 14px 200px 14px 48px;
  font-size: 16px;
  font-weight: 400;
  outline: none;
  border: 1px solid ${s("inputBorder")};
  background: ${s("inputBackground")};
  border-radius: 12px;
  color: ${s("text")};
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:focus {
    border-color: ${s("accent")};
    box-shadow: 0 0 0 3px
      ${(props) => transparentize(0.85, props.theme.accent)};
  }

  ::-webkit-search-cancel-button {
    -webkit-appearance: none;
  }
  ::placeholder {
    color: ${s("placeholder")};
  }

  ${breakpoint("mobile")`
    padding-right: 16px;
  `};
`;

const KeyHints = styled.div`
  position: absolute;
  right: 12px;
  display: none;
  align-items: center;
  gap: 4px;
  pointer-events: none;

  ${breakpoint("tablet")`
    display: flex;
  `};
`;

const KeyHint = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${s("textTertiary")};
  background: ${s("backgroundSecondary")};
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid ${s("inputBorder")};
`;

const KeyHintLabel = styled.span`
  font-size: 12px;
  color: ${s("textTertiary")};
  margin-right: 8px;
`;

const CategoryChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const CategoryChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid
    ${(props) => (props.$active ? props.theme.accent : "transparent")};
  background: ${(props) =>
    props.$active
      ? transparentize(0.9, props.theme.accent)
      : props.theme.backgroundSecondary};
  color: ${(props) =>
    props.$active ? props.theme.accent : props.theme.textSecondary};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    background: ${(props) =>
      props.$active
        ? transparentize(0.85, props.theme.accent)
        : props.theme.backgroundTertiary};
  }
`;

const ChipIcon = styled.span`
  font-size: 14px;
  opacity: 0.7;
`;

const ResultsCard = styled.div`
  background: ${s("background")};
  border: 1px solid ${s("inputBorder")};
  border-radius: 16px;
  min-height: 200px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyIconCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fef2f2;
  margin-bottom: 16px;
`;

const EmptyBolt = styled.span`
  font-size: 28px;
  color: #e63950;
`;

const EmptyIcon = styled.div`
  font-size: 28px;
  color: ${s("textTertiary")};
  margin-bottom: 16px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${s("text")};
  margin: 0 0 8px;
`;

const EmptySubtitle = styled.p`
  font-size: 14px;
  color: ${s("textTertiary")};
  margin: 0;
  max-width: 360px;
  line-height: 1.5;
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ResultItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  background: ${(props) =>
    props.$selected ? props.theme.listItemHoverBackground : "transparent"};
  border-bottom: 1px solid ${s("divider")};
  transition: background 50ms ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${s("listItemHoverBackground")};
  }
`;

const ResultTypeIcon = styled.div<{ $type: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-size: 16px;
  flex-shrink: 0;
  background: ${(props) =>
    props.$type === "condition"
      ? "#fef2f2"
      : props.$type === "intervention"
        ? "#f0f4f8"
        : "#ecfdf5"};
  color: ${(props) =>
    props.$type === "condition"
      ? "#e63950"
      : props.$type === "intervention"
        ? "#486581"
        : "#059669"};
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${s("text")};
`;

const ResultType = styled.div`
  font-size: 12px;
  color: ${s("textTertiary")};
  text-transform: capitalize;
`;

const ResultStatus = styled.span<{ $status: string }>`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
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

const FooterHints = styled.div`
  display: none;
  justify-content: center;
  gap: 24px;
  margin-top: 20px;

  ${breakpoint("tablet")`
    display: flex;
  `};
`;

const FooterHint = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${s("textTertiary")};
`;

const FooterKey = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${s("textTertiary")};
  background: ${s("backgroundSecondary")};
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid ${s("inputBorder")};
`;

export default observer(Search);
