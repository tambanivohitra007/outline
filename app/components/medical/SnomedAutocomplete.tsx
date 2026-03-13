import { observer } from "mobx-react";
import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { client } from "~/utils/ApiClient";
import styled from "styled-components";
import { s } from "@shared/styles";

interface SnomedResult {
  conceptId: string;
  term: string;
  fsn: string;
}

interface Props {
  /** Called when a concept is selected */
  onSelect: (conceptId: string, term: string) => void;
  /** Placeholder text */
  placeholder?: string;
}

function SnomedAutocomplete({ onSelect, placeholder }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SnomedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (value.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const res = await client.post("/medical.snomed.search", {
            term: value,
            limit: 10,
          });
          setResults(res.data ?? []);
          setIsOpen(true);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    []
  );

  const handleSelect = useCallback(
    (result: SnomedResult) => {
      onSelect(result.conceptId, result.term);
      setQuery(result.term);
      setIsOpen(false);
    },
    [onSelect]
  );

  return (
    <Container>
      <Input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder ?? t("Search SNOMED CT...")}
      />
      {isLoading && <LoadingIndicator />}
      {isOpen && results.length > 0 && (
        <Dropdown>
          {results.map((result) => (
            <DropdownItem
              key={result.conceptId}
              onClick={() => handleSelect(result)}
            >
              <ConceptTerm>{result.term}</ConceptTerm>
              <ConceptId>{result.conceptId}</ConceptId>
            </DropdownItem>
          ))}
        </Dropdown>
      )}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
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

const LoadingIndicator = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border: 2px solid ${s("divider")};
  border-top-color: ${s("accent")};
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to {
      transform: translateY(-50%) rotate(360deg);
    }
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: ${s("menuBackground")};
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
`;

const DropdownItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: ${s("listItemHoverBackground")};
  }
`;

const ConceptTerm = styled.span`
  font-size: 14px;
  color: ${s("text")};
`;

const ConceptId = styled.span`
  font-size: 12px;
  color: ${s("textTertiary")};
  margin-left: 8px;
`;

export default observer(SnomedAutocomplete);
