import { observer } from "mobx-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useHistory } from "react-router-dom";
import type ConditionSection from "~/models/ConditionSection";
import AIGenerateButton from "~/components/medical/AIGenerateButton";
import useStores from "~/hooks/useStores";
import { client } from "~/utils/ApiClient";
import styled from "styled-components";
import { s } from "@shared/styles";

interface Props {
  section: ConditionSection;
  conditionName: string;
}

const SECTION_ICONS: Record<string, string> = {
  risk_factors: "\u26a0\ufe0f",
  physiology: "\ud83e\udde0",
  complications: "\u2757",
  solutions: "\u2705",
  bible_sop: "\ud83d\udcd6",
  research_ideas: "\ud83d\udd2c",
};

const SECTION_DESCRIPTIONS: Record<string, string> = {
  risk_factors: "Identify risk factors and predispositions for this condition.",
  physiology: "Describe the underlying physiology and pathophysiology.",
  complications: "Document potential complications and comorbidities.",
  solutions: "Therapeutic interventions organized by NEWSTART+ care domains.",
  bible_sop: "Scripture references and Spirit of Prophecy quotations.",
  research_ideas: "Document research gaps and potential study ideas.",
};

function SectionPanel({ section, conditionName }: Props) {
  const { t } = useTranslation();
  const { documents, conditionSections } = useStores();
  const history = useHistory();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const icon = SECTION_ICONS[section.sectionType] ?? "";
  const description = SECTION_DESCRIPTIONS[section.sectionType] ?? "";
  const document = section.documentId
    ? documents.get(section.documentId)
    : null;

  const handleOpenEditor = () => {
    if (document) {
      history.push(document.path);
    }
  };

  const handleCreateDocument = useCallback(async () => {
    setIsCreating(true);
    try {
      const res = await client.post("/conditionSections.createDocument", {
        id: section.id,
      });
      if (res.data) {
        // Update the section in the store with the new documentId
        conditionSections.add(res.data);
        // Fetch the newly created document
        if (res.data.documentId) {
          await documents.fetch(res.data.documentId);
        }
      }
    } finally {
      setIsCreating(false);
    }
  }, [section.id, conditionSections, documents]);

  return (
    <Panel>
      <PanelHeader onClick={() => setIsExpanded(!isExpanded)}>
        <HeaderLeft>
          <SectionIcon>{icon}</SectionIcon>
          <SectionTitle>{section.title}</SectionTitle>
          {document && (
            <DocumentStatus>
              {document.publishedAt ? t("Published") : t("Draft")}
            </DocumentStatus>
          )}
        </HeaderLeft>
        <ExpandIcon $expanded={isExpanded}>&#9660;</ExpandIcon>
      </PanelHeader>

      {isExpanded && (
        <PanelContent>
          <SectionDescription>{t(description)}</SectionDescription>

          {section.documentId ? (
            <EditorArea>
              <DocumentPreview onClick={handleOpenEditor}>
                <PreviewContent>
                  {document?.title ? (
                    <PreviewText>
                      {document.title}
                    </PreviewText>
                  ) : (
                    <PreviewEmpty>
                      {t("Click to start writing content for this section.")}
                    </PreviewEmpty>
                  )}
                </PreviewContent>
                <OpenButton>{t("Open Editor")}</OpenButton>
              </DocumentPreview>
              <AIGenerateButton
                conditionName={conditionName}
                sectionType={section.sectionType}
                onGenerated={(content) => {
                  if (document) {
                    void navigator.clipboard.writeText(content);
                    toast.success(t("Content copied to clipboard. Paste it in the editor."));
                    history.push(document.path);
                  }
                }}
              />
            </EditorArea>
          ) : (
            <NoDocPlaceholder>
              <PlaceholderText>
                {t("No document created for this section yet.")}
              </PlaceholderText>
              <CreateButton onClick={handleCreateDocument} disabled={isCreating}>
                {isCreating
                  ? t("Creating\u2026")
                  : t("Create Document")}
              </CreateButton>
            </NoDocPlaceholder>
          )}
        </PanelContent>
      )}
    </Panel>
  );
}

const Panel = styled.div`
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  background: ${s("backgroundSecondary")};
  user-select: none;

  &:hover {
    background: ${s("backgroundTertiary")};
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionIcon = styled.span`
  font-size: 18px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${s("text")};
`;

const DocumentStatus = styled.span`
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 3px;
  background: ${s("accent")};
  color: white;
  text-transform: uppercase;
`;

const ExpandIcon = styled.span<{ $expanded: boolean }>`
  font-size: 10px;
  color: ${s("textTertiary")};
  transition: transform 200ms ease;
  transform: rotate(${(props) => (props.$expanded ? "0deg" : "-90deg")});
`;

const PanelContent = styled.div`
  padding: 16px;
  border-top: 1px solid ${s("divider")};
`;

const SectionDescription = styled.p`
  margin: 0 0 12px 0;
  font-size: 13px;
  color: ${s("textTertiary")};
  font-style: italic;
`;

const EditorArea = styled.div``;

const DocumentPreview = styled.div`
  padding: 16px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 200ms ease, box-shadow 200ms ease;

  &:hover {
    border-color: ${s("accent")};
    box-shadow: 0 0 0 1px ${s("accent")};
  }
`;

const PreviewContent = styled.div`
  margin-bottom: 12px;
`;

const PreviewText = styled.div`
  font-size: 13px;
  color: ${s("textSecondary")};
  line-height: 1.6;
  white-space: pre-wrap;
`;

const PreviewEmpty = styled.div`
  font-size: 13px;
  color: ${s("textTertiary")};
  font-style: italic;
  text-align: center;
  padding: 16px 0;
`;

const OpenButton = styled.div`
  display: inline-block;
  padding: 6px 14px;
  background: ${s("accent")};
  color: white;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    opacity: 0.9;
  }
`;

const NoDocPlaceholder = styled.div`
  padding: 24px;
  text-align: center;
  border: 2px dashed ${s("divider")};
  border-radius: 6px;
`;

const PlaceholderText = styled.p`
  margin: 0 0 12px 0;
  font-size: 13px;
  color: ${s("textTertiary")};
`;

const CreateButton = styled.button`
  padding: 8px 20px;
  background: ${s("accent")};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default observer(SectionPanel);
