import { observer } from "mobx-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Flex from "~/components/Flex";
import type Condition from "~/models/Condition";
import useStores from "~/hooks/useStores";
import styled from "styled-components";
import { s } from "@shared/styles";

interface Props {
  condition: Condition;
}

function MetadataPanel({ condition }: Props) {
  const { t } = useTranslation();
  const { conditions, evidenceEntries, scriptures } = useStores();

  useEffect(() => {
    void evidenceEntries.fetchPage({ conditionId: condition.id });
    void scriptures.fetchPage({ conditionId: condition.id });
  }, [condition.id, evidenceEntries, scriptures]);

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    await conditions.update({
      id: condition.id,
      status: e.target.value as "draft" | "review" | "published",
    });
  };

  const evidence = evidenceEntries.forCondition(condition.id);
  const conditionScriptures = scriptures.forCondition(condition.id);

  return (
    <Panel>
      <PanelSection>
        <PanelTitle>{t("Status")}</PanelTitle>
        <StatusSelect
          value={condition.status}
          onChange={handleStatusChange}
        >
          <option value="draft">{t("Draft")}</option>
          <option value="review">{t("In Review")}</option>
          <option value="published">{t("Published")}</option>
        </StatusSelect>
      </PanelSection>

      <PanelSection>
        <PanelTitle>{t("Medical Codes")}</PanelTitle>
        <MetaField>
          <MetaLabel>{t("SNOMED CT")}</MetaLabel>
          <MetaValue>{condition.snomedCode || t("Not set")}</MetaValue>
        </MetaField>
        <MetaField>
          <MetaLabel>{t("ICD Code")}</MetaLabel>
          <MetaValue>{condition.icdCode || t("Not set")}</MetaValue>
        </MetaField>
      </PanelSection>

      <PanelSection>
        <PanelTitle>
          {t("Evidence")} ({evidence.length})
        </PanelTitle>
        {evidence.length === 0 ? (
          <EmptyHint>{t("No evidence entries linked.")}</EmptyHint>
        ) : (
          <ItemList>
            {evidence.slice(0, 5).map((entry) => (
              <EvidenceItem key={entry.id}>
                <EvidenceTitle>{entry.title}</EvidenceTitle>
                {entry.journal && (
                  <EvidenceMeta>{entry.journal}</EvidenceMeta>
                )}
              </EvidenceItem>
            ))}
            {evidence.length > 5 && (
              <MoreLink>
                {t("and {{count}} more...", { count: evidence.length - 5 })}
              </MoreLink>
            )}
          </ItemList>
        )}
      </PanelSection>

      <PanelSection>
        <PanelTitle>
          {t("Scriptures")} ({conditionScriptures.length})
        </PanelTitle>
        {conditionScriptures.length === 0 ? (
          <EmptyHint>{t("No scripture references linked.")}</EmptyHint>
        ) : (
          <ItemList>
            {conditionScriptures.slice(0, 5).map((scripture) => (
              <ScriptureItem key={scripture.id}>
                <ScriptureRef>{scripture.reference}</ScriptureRef>
                {scripture.spiritOfProphecy && (
                  <SopBadge>{t("SoP")}</SopBadge>
                )}
              </ScriptureItem>
            ))}
          </ItemList>
        )}
      </PanelSection>
    </Panel>
  );
}

const Panel = styled.div`
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  overflow: hidden;
`;

const PanelSection = styled.div`
  padding: 12px 16px;

  &:not(:last-child) {
    border-bottom: 1px solid ${s("divider")};
  }
`;

const PanelTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${s("textTertiary")};
  letter-spacing: 0.5px;
`;

const StatusSelect = styled.select`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid ${s("divider")};
  border-radius: 4px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 13px;
`;

const MetaField = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
`;

const MetaLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${s("textSecondary")};
`;

const MetaValue = styled.span`
  font-size: 13px;
  color: ${s("text")};
`;

const EmptyHint = styled.div`
  font-size: 12px;
  color: ${s("textTertiary")};
  font-style: italic;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const EvidenceItem = styled.div`
  padding: 6px 0;
`;

const EvidenceTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${s("text")};
  line-height: 1.3;
`;

const EvidenceMeta = styled.div`
  font-size: 11px;
  color: ${s("textTertiary")};
  margin-top: 2px;
`;

const ScriptureItem = styled(Flex)`
  align-items: center;
  gap: 6px;
  padding: 4px 0;
`;

const ScriptureRef = styled.span`
  font-size: 13px;
  color: ${s("text")};
`;

const SopBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
  background: #e8d5f5;
  color: #6b21a8;
`;

const MoreLink = styled.div`
  font-size: 12px;
  color: ${s("accent")};
  cursor: pointer;
`;

export default observer(MetadataPanel);
