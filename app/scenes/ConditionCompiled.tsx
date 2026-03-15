import { observer } from "mobx-react";
import { PrintIcon, BackIcon } from "outline-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import type { RouteComponentProps } from "react-router-dom";
import Flex from "~/components/Flex";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Scene from "~/components/Scene";
import useStores from "~/hooks/useStores";
import { client } from "~/utils/ApiClient";
import { conditionPath } from "~/utils/routeHelpers";
import styled from "styled-components";
import { s } from "@shared/styles";

interface CompiledSection {
  id: string;
  sectionType: string;
  title: string;
  markdown: string;
}

interface CompiledData {
  condition: {
    id: string;
    name: string;
    slug: string;
    snomedCode?: string;
    icdCode?: string;
    status: string;
  };
  sections: CompiledSection[];
}

type Params = {
  id: string;
};

type Props = RouteComponentProps<Params>;

function ConditionCompiled({ match }: Props) {
  const { t } = useTranslation();
  const history = useHistory();
  const { conditions } = useStores();
  const { id } = match.params;
  const [data, setData] = useState<CompiledData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await client.post("/conditions.compile", { id });
        setData(res.data as CompiledData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("Failed to compile document")
        );
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [id, t]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleBack = useCallback(() => {
    history.push(conditionPath(id));
  }, [history, id]);

  const handleCopyMarkdown = useCallback(async () => {
    if (!data) {
      return;
    }
    const full = buildFullMarkdown(data);
    await navigator.clipboard.writeText(full);
  }, [data]);

  if (isLoading) {
    return (
      <Scene title={t("Loading...")}>
        <PlaceholderDocument />
      </Scene>
    );
  }

  if (error || !data) {
    return (
      <Scene title={t("Error")}>
        <ErrorMessage>{error || t("Failed to load compiled document")}</ErrorMessage>
      </Scene>
    );
  }

  const { condition, sections } = data;
  const nonEmpty = sections.filter((s) => s.markdown.trim().length > 0);

  return (
    <Scene title={`${condition.name} - ${t("Compiled Document")}`} wide>
      <Toolbar className="no-print">
        <BackButton onClick={handleBack}>
          <BackIcon size={18} />
          {t("Back to Editor")}
        </BackButton>
        <ButtonGroup>
          <ToolbarButton onClick={handleCopyMarkdown}>
            {t("Copy Markdown")}
          </ToolbarButton>
          <ToolbarButton onClick={handlePrint} $primary>
            <PrintIcon size={16} />
            {t("Print / Export PDF")}
          </ToolbarButton>
        </ButtonGroup>
      </Toolbar>

      <CompiledDocument>
        <DocumentTitle>{condition.name}</DocumentTitle>

        {(condition.snomedCode || condition.icdCode) && (
          <CodeRow>
            {condition.snomedCode && (
              <CodeTag>SNOMED: {condition.snomedCode}</CodeTag>
            )}
            {condition.icdCode && (
              <CodeTag>ICD: {condition.icdCode}</CodeTag>
            )}
          </CodeRow>
        )}

        <StatusRow>
          <StatusBadge $status={condition.status}>
            {condition.status}
          </StatusBadge>
        </StatusRow>

        <Divider />

        <TableOfContents>
          <TocTitle>{t("Table of Contents")}</TocTitle>
          <TocList>
            {nonEmpty.map((section, idx) => (
              <TocItem key={section.id}>
                <TocLink href={`#section-${section.id}`}>
                  {idx + 1}. {section.title}
                </TocLink>
              </TocItem>
            ))}
          </TocList>
        </TableOfContents>

        <Divider />

        {nonEmpty.map((section, idx) => (
          <SectionBlock key={section.id} id={`section-${section.id}`}>
            <SectionNumber>{idx + 1}</SectionNumber>
            <SectionTitle>{section.title}</SectionTitle>
            <SectionContent>
              <MarkdownContent
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(section.markdown),
                }}
              />
            </SectionContent>
          </SectionBlock>
        ))}

        {nonEmpty.length === 0 && (
          <EmptyState>
            {t("No section content has been written yet.")}
          </EmptyState>
        )}

        <Footer>
          <FooterText>
            {t("Generated on {{date}}", {
              date: new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            })}
          </FooterText>
        </Footer>
      </CompiledDocument>
    </Scene>
  );
}

/**
 * Build full markdown from compiled data for clipboard copy.
 *
 * @param data The compiled condition data.
 * @returns Full markdown string.
 */
function buildFullMarkdown(data: CompiledData): string {
  const lines: string[] = [];
  lines.push(`# ${data.condition.name}`);
  lines.push("");
  if (data.condition.snomedCode) {
    lines.push(`**SNOMED:** ${data.condition.snomedCode}`);
  }
  if (data.condition.icdCode) {
    lines.push(`**ICD:** ${data.condition.icdCode}`);
  }
  lines.push("");

  for (const section of data.sections) {
    if (section.markdown.trim()) {
      lines.push(`## ${section.title}`);
      lines.push("");
      lines.push(section.markdown);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Convert markdown text to basic HTML for display.
 * Handles headings, bold, italic, lists, paragraphs, and line breaks.
 *
 * @param md The markdown string.
 * @returns HTML string.
 */
function markdownToHtml(md: string): string {
  let html = md
    // Escape HTML entities
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^## (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^# (.+)$/gm, "<h2>$1</h2>");

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Unordered lists
  html = html.replace(/^[*-] (.+)$/gm, "<li>$1</li>");

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr />");

  // Paragraphs: wrap lines that are not already HTML tags
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) {
        return "";
      }
      if (/^<(h[1-6]|ul|ol|li|hr|blockquote)/.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

// Styled components

const Toolbar = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid ${s("divider")};

  @media print {
    display: none !important;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: none;
  color: ${s("textSecondary")};
  font-size: 13px;
  cursor: pointer;

  &:hover {
    color: ${s("text")};
  }
`;

const ToolbarButton = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 100ms ease;
  border: ${(props) =>
    props.$primary ? "none" : `1px solid ${props.theme.divider}`};
  background: ${(props) => (props.$primary ? props.theme.accent : "transparent")};
  color: ${(props) => (props.$primary ? "#fff" : props.theme.textSecondary)};

  &:hover {
    opacity: 0.85;
  }
`;

const CompiledDocument = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 32px;
  background: ${s("background")};

  @media print {
    max-width: none;
    padding: 0;
    margin: 0;
  }
`;

const DocumentTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${s("text")};
  margin: 0 0 12px;
  line-height: 1.2;
`;

const CodeRow = styled(Flex)`
  gap: 8px;
  margin-bottom: 8px;
`;

const CodeTag = styled.span`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${s("backgroundSecondary")};
  color: ${s("textSecondary")};
  font-family: monospace;
`;

const StatusRow = styled.div`
  margin-bottom: 16px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 10px;
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

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${s("divider")};
  margin: 24px 0;
`;

const TableOfContents = styled.div`
  margin-bottom: 8px;
`;

const TocTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${s("textSecondary")};
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TocList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const TocItem = styled.li`
  margin-bottom: 6px;
`;

const TocLink = styled.a`
  font-size: 14px;
  color: ${s("accent")};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const SectionBlock = styled.div`
  margin-bottom: 32px;
  page-break-inside: avoid;
`;

const SectionNumber = styled.span`
  display: inline-block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  border-radius: 50%;
  background: ${s("accent")};
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: ${s("text")};
  margin: 8px 0 16px;
`;

const SectionContent = styled.div`
  font-size: 15px;
  line-height: 1.7;
  color: ${s("text")};
`;

const MarkdownContent = styled.div`
  h2, h3, h4 {
    margin: 16px 0 8px;
    color: ${s("text")};
  }

  h2 { font-size: 20px; }
  h3 { font-size: 17px; }
  h4 { font-size: 15px; }

  p {
    margin: 0 0 12px;
  }

  ul, ol {
    padding-left: 24px;
    margin: 0 0 12px;
  }

  li {
    margin-bottom: 4px;
  }

  strong {
    font-weight: 600;
  }

  hr {
    border: none;
    border-top: 1px solid ${s("divider")};
    margin: 16px 0;
  }
`;

const EmptyState = styled.div`
  padding: 60px 40px;
  text-align: center;
  color: ${s("textTertiary")};
  font-size: 14px;
`;

const Footer = styled.div`
  margin-top: 40px;
  padding-top: 16px;
  border-top: 1px solid ${s("divider")};
  text-align: center;
`;

const FooterText = styled.span`
  font-size: 12px;
  color: ${s("textTertiary")};
`;

const ErrorMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #dc3545;
  font-size: 14px;
`;

export default observer(ConditionCompiled);
