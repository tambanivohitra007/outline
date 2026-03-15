import DOMPurify from "dompurify";
import markdownit from "markdown-it";
import { PrintIcon, BackIcon } from "outline-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import type { RouteComponentProps } from "react-router-dom";
import { toast } from "sonner";
import styled from "styled-components";
import { s } from "@shared/styles";
import Flex from "~/components/Flex";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Scene from "~/components/Scene";
import { client } from "~/utils/ApiClient";
import { conditionPath } from "~/utils/routeHelpers";

const md = markdownit({ html: false, breaks: true, linkify: false });

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

/**
 * Safely convert markdown to sanitized HTML.
 *
 * @param content Markdown string.
 * @returns Sanitized HTML string.
 */
function markdownToHtml(content: string): string {
  return DOMPurify.sanitize(md.render(content));
}

function ConditionCompiled({ match }: Props) {
  const { t } = useTranslation();
  const history = useHistory();
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
    try {
      await navigator.clipboard.writeText(full);
      toast.success(t("Copied to clipboard"));
    } catch {
      toast.error(t("Failed to copy to clipboard"));
    }
  }, [data, t]);

  const renderedSections = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.sections
      .filter((section) => section.markdown.trim().length > 0)
      .map((section) => ({
        ...section,
        html: markdownToHtml(section.markdown),
      }));
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

  const { condition } = data;

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
            {renderedSections.map((section, idx) => (
              <TocItem key={section.id}>
                <TocLink href={`#section-${section.id}`}>
                  {idx + 1}. {section.title}
                </TocLink>
              </TocItem>
            ))}
          </TocList>
        </TableOfContents>

        <Divider />

        {renderedSections.map((section, idx) => (
          <SectionBlock key={section.id} id={`section-${section.id}`}>
            <SectionNumber>{idx + 1}</SectionNumber>
            <SectionTitle>{section.title}</SectionTitle>
            <SectionContent>
              <MarkdownContent
                dangerouslySetInnerHTML={{
                  __html: section.html,
                }}
              />
            </SectionContent>
          </SectionBlock>
        ))}

        {renderedSections.length === 0 && (
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
  color: ${(props) => (props.$primary ? props.theme.accentText : props.theme.textSecondary)};

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
      ? props.theme.noticeSuccessBackground
      : props.$status === "review"
        ? props.theme.noticeInfoBackground
        : s("backgroundSecondary")(props)};
  color: ${(props) =>
    props.$status === "published"
      ? props.theme.noticeSuccessText
      : props.$status === "review"
        ? props.theme.noticeInfoText
        : s("textTertiary")(props)};
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
  color: ${s("accentText")};
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
  color: ${s("danger")};
  font-size: 14px;
`;

export default ConditionCompiled;
