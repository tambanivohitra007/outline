import { observer } from "mobx-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type ConditionSection from "~/models/ConditionSection";
import styled from "styled-components";
import { s } from "@shared/styles";

interface Props {
  section: ConditionSection;
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

function SectionPanel({ section }: Props) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  const icon = SECTION_ICONS[section.sectionType] ?? "";
  const description = SECTION_DESCRIPTIONS[section.sectionType] ?? "";

  return (
    <Panel>
      <PanelHeader onClick={() => setIsExpanded(!isExpanded)}>
        <HeaderLeft>
          <SectionIcon>{icon}</SectionIcon>
          <SectionTitle>{section.title}</SectionTitle>
        </HeaderLeft>
        <ExpandIcon $expanded={isExpanded}>&#9660;</ExpandIcon>
      </PanelHeader>

      {isExpanded && (
        <PanelContent>
          <SectionDescription>{t(description)}</SectionDescription>

          {section.documentId ? (
            <EditorPlaceholder>
              <EditorLink
                href={`/doc/${section.documentId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("Open in collaborative editor")}
              </EditorLink>
              <EditorHint>
                {t("This section is backed by a collaborative document. Click to open the full editor with real-time collaboration.")}
              </EditorHint>
            </EditorPlaceholder>
          ) : (
            <NoDocPlaceholder>
              {t("No document linked to this section yet. Create content via the API to get started.")}
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
    background: ${s("sidebarBackground")};
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

const EditorPlaceholder = styled.div`
  padding: 20px;
  border: 2px dashed ${s("divider")};
  border-radius: 6px;
  text-align: center;
`;

const EditorLink = styled.a`
  display: inline-block;
  padding: 8px 16px;
  background: ${s("accent")};
  color: white;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;

  &:hover {
    opacity: 0.9;
  }
`;

const EditorHint = styled.p`
  margin: 8px 0 0 0;
  font-size: 12px;
  color: ${s("textTertiary")};
`;

const NoDocPlaceholder = styled.div`
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: ${s("textTertiary")};
  border: 2px dashed ${s("divider")};
  border-radius: 6px;
`;

export default observer(SectionPanel);
