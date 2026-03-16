import { observer } from "mobx-react";
import MarkdownIt from "markdown-it";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useHistory } from "react-router-dom";
import type ConditionSection from "~/models/ConditionSection";
import { ProsemirrorHelper } from "~/models/helpers/ProsemirrorHelper";
import AIGenerateButton from "~/components/medical/AIGenerateButton";
import useStores from "~/hooks/useStores";
import { client } from "~/utils/ApiClient";
import styled from "styled-components";
import { s } from "@shared/styles";

const md = new MarkdownIt({ linkify: true, typographer: true });

interface Props {
  section: ConditionSection;
  conditionName: string;
}

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
  const [aiContent, setAiContent] = useState("");

  const aiHtml = useMemo(() => (aiContent ? md.render(aiContent) : ""), [aiContent]);

  const description = SECTION_DESCRIPTIONS[section.sectionType] ?? "";
  const document = section.documentId
    ? documents.get(section.documentId)
    : null;

  const contentHtml = useMemo(() => {
    if (!document?.data) {
      return "";
    }
    try {
      const markdown = ProsemirrorHelper.toMarkdown(document);
      return markdown.trim() ? md.render(markdown) : "";
    } catch {
      return "";
    }
  }, [document?.data]);

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
              {contentHtml ? (
                <DocumentPreview>
                  <ContentRendered dangerouslySetInnerHTML={{ __html: contentHtml }} />
                  <PreviewFooter>
                    <OpenButton onClick={handleOpenEditor}>{t("Open Editor")}</OpenButton>
                  </PreviewFooter>
                </DocumentPreview>
              ) : (
                <DocumentPreview onClick={handleOpenEditor}>
                  <PreviewEmpty>
                    {t("Click to start writing content for this section.")}
                  </PreviewEmpty>
                  <OpenButton>{t("Open Editor")}</OpenButton>
                </DocumentPreview>
              )}
              <AIGenerateButton
                conditionName={conditionName}
                sectionType={section.sectionType}
                onGenerated={(content) => {
                  setAiContent(content);
                }}
              />
              {aiContent && (
                <AIPreviewArea>
                  <AIPreviewHeader>
                    <AIPreviewTitle>{t("AI Generated Content")}</AIPreviewTitle>
                    <AIPreviewActions>
                      <AIActionButton
                        onClick={() => {
                          void navigator.clipboard.writeText(aiContent);
                          toast.success(t("Copied to clipboard"));
                          if (document) {
                            history.push(document.path);
                          }
                        }}
                      >
                        {t("Copy & Edit")}
                      </AIActionButton>
                      <AIActionButtonSecondary onClick={() => setAiContent("")}>
                        {t("Dismiss")}
                      </AIActionButtonSecondary>
                    </AIPreviewActions>
                  </AIPreviewHeader>
                  <AIPreviewContent dangerouslySetInnerHTML={{ __html: aiHtml }} />
                </AIPreviewArea>
              )}
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
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 200ms ease;

  &:hover {
    border-color: ${s("textTertiary")};
  }
`;

const ContentRendered = styled.div`
  padding: 16px;
  font-size: 13px;
  color: ${s("text")};
  line-height: 1.7;
  max-height: 500px;
  overflow-y: auto;

  h1, h2, h3, h4, h5, h6 {
    margin: 12px 0 6px;
    font-weight: 600;
    color: ${s("text")};
  }

  h1 { font-size: 1.3em; }
  h2 { font-size: 1.15em; }
  h3 { font-size: 1.05em; }

  p {
    margin: 0 0 8px;
  }

  ul, ol {
    margin: 0 0 8px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  strong {
    font-weight: 600;
  }

  code {
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.9em;
    background: ${s("codeBackground")};
  }

  blockquote {
    margin: 8px 0;
    padding: 4px 12px;
    border-left: 3px solid ${s("accent")};
    color: ${s("textSecondary")};
  }

  a {
    color: ${s("accent")};
    text-decoration: underline;
  }

  img {
    max-width: 100%;
    border-radius: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 12px;
  }

  th, td {
    border: 1px solid ${s("divider")};
    padding: 6px 8px;
    text-align: left;
  }

  th {
    background: ${s("backgroundSecondary")};
    font-weight: 600;
  }
`;

const PreviewFooter = styled.div`
  padding: 8px 16px;
  border-top: 1px solid ${s("divider")};
  background: ${s("backgroundSecondary")};
`;

const PreviewEmpty = styled.div`
  font-size: 13px;
  color: ${s("textTertiary")};
  font-style: italic;
  text-align: center;
  padding: 16px;
  cursor: pointer;
`;

const OpenButton = styled.div`
  display: inline-block;
  padding: 6px 14px;
  background: ${s("accent")};
  color: white;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

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

const AIPreviewArea = styled.div`
  margin-top: 12px;
  border: 1px solid ${s("accent")};
  border-radius: 6px;
  overflow: hidden;
`;

const AIPreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${s("accent")};
`;

const AIPreviewTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AIPreviewActions = styled.div`
  display: flex;
  gap: 6px;
`;

const AIActionButton = styled.button`
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid white;
  border-radius: 4px;
  background: white;
  color: ${s("accent")};
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const AIActionButtonSecondary = styled.button`
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  background: transparent;
  color: white;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const AIPreviewContent = styled.div`
  padding: 12px 16px;
  font-size: 13px;
  color: ${s("text")};
  line-height: 1.7;
  max-height: 400px;
  overflow-y: auto;

  h1, h2, h3, h4, h5, h6 {
    margin: 12px 0 6px;
    font-weight: 600;
    color: ${s("text")};
  }

  h1 { font-size: 1.3em; }
  h2 { font-size: 1.15em; }
  h3 { font-size: 1.05em; }

  p {
    margin: 0 0 8px;
  }

  ul, ol {
    margin: 0 0 8px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  strong {
    font-weight: 600;
  }

  code {
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.9em;
    background: ${s("codeBackground")};
  }

  blockquote {
    margin: 8px 0;
    padding: 4px 12px;
    border-left: 3px solid ${s("accent")};
    color: ${s("textSecondary")};
  }

  a {
    color: ${s("accent")};
    text-decoration: underline;
  }
`;

export default observer(SectionPanel);
