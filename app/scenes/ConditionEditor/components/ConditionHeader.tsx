import { observer } from "mobx-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Flex from "~/components/Flex";
import type Condition from "~/models/Condition";
import useStores from "~/hooks/useStores";
import styled from "styled-components";
import { s } from "@shared/styles";

interface Props {
  condition: Condition;
}

const SECTION_TYPE_LABELS: Record<string, string> = {
  risk_factors: "Risk Factors",
  physiology: "Physiology",
  complications: "Complications",
  solutions: "Solutions",
  bible_sop: "Bible & Spirit of Prophecy",
  research_ideas: "Research Ideas",
};

function ConditionHeader({ condition }: Props) {
  const { t } = useTranslation();
  const { conditions } = useStores();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(condition.name);

  const handleSave = useCallback(async () => {
    if (name.trim() && name !== condition.name) {
      await conditions.update({ id: condition.id, name: name.trim() });
    }
    setIsEditing(false);
  }, [conditions, condition, name]);

  return (
    <Header>
      <TopRow>
        {isEditing ? (
          <NameInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleSave();
              }
            }}
            autoFocus
          />
        ) : (
          <ConditionName onClick={() => setIsEditing(true)}>
            {condition.name}
          </ConditionName>
        )}
        <StatusBadge $status={condition.status}>
          {condition.status}
        </StatusBadge>
      </TopRow>

      <MetaRow>
        {condition.snomedCode && (
          <MetaTag>
            <MetaLabel>{t("SNOMED")}</MetaLabel>
            {condition.snomedCode}
          </MetaTag>
        )}
        {condition.icdCode && (
          <MetaTag>
            <MetaLabel>{t("ICD")}</MetaLabel>
            {condition.icdCode}
          </MetaTag>
        )}
      </MetaRow>
    </Header>
  );
}

const Header = styled.div`
  margin-bottom: 8px;
`;

const TopRow = styled(Flex)`
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const ConditionName = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: ${s("text")};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const NameInput = styled.input`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: ${s("text")};
  background: transparent;
  border: none;
  border-bottom: 2px solid ${s("accent")};
  outline: none;
  width: 100%;
  padding: 0;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 12px;
  white-space: nowrap;
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

const MetaRow = styled(Flex)`
  gap: 8px;
`;

const MetaTag = styled.span`
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${s("backgroundSecondary")};
  color: ${s("textSecondary")};
`;

const MetaLabel = styled.span`
  font-weight: 600;
  margin-right: 4px;
`;

export default observer(ConditionHeader);
