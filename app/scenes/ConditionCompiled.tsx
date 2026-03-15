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

interface CompiledIntervention {
  id: string;
  conditionId: string;
  interventionId: string;
  careDomainId: string | null;
  evidenceLevel: string | null;
  recommendationLevel: string | null;
  intervention: {
    id: string;
    name: string;
    category: string | null;
    description: string | null;
  } | null;
  careDomainName: string | null;
}

interface CompiledEvidence {
  id: string;
  title: string;
  pubmedId: string | null;
  doi: string | null;
  authors: string | null;
  journal: string | null;
  publicationDate: string | null;
  abstract: string | null;
  url: string | null;
  studyType: string | null;
  qualityRating: string | null;
  sampleSize: number | null;
  summary: string | null;
}

interface CompiledScripture {
  id: string;
  reference: string;
  text: string;
  theme: string | null;
  spiritOfProphecy: boolean;
  sopSource: string | null;
  sopPage: string | null;
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
  interventions: CompiledIntervention[];
  evidence: CompiledEvidence[];
  scriptures: CompiledScripture[];
}

type Params = {
  id: string;
};

type Props = RouteComponentProps<Params>;

const EVIDENCE_LEVEL_LABELS: Record<string, string> = {
  A: "Strong (Level A)",
  B: "Moderate (Level B)",
  C: "Weak (Level C)",
  D: "Expert Opinion (Level D)",
};

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

  // Group interventions by care domain
  const interventionsByDomain = useMemo(() => {
    if (!data) {
      return new Map<string, CompiledIntervention[]>();
    }
    const grouped = new Map<string, CompiledIntervention[]>();
    for (const ci of data.interventions) {
      const domain = ci.careDomainName || "Other";
      const list = grouped.get(domain) || [];
      list.push(ci);
      grouped.set(domain, list);
    }
    return grouped;
  }, [data]);

  // Separate scriptures from SoP
  const bibleVerses = useMemo(
    () => data?.scriptures.filter((s) => !s.spiritOfProphecy) ?? [],
    [data]
  );
  const sopWritings = useMemo(
    () => data?.scriptures.filter((s) => s.spiritOfProphecy) ?? [],
    [data]
  );

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
  const hasInterventions = data.interventions.length > 0;
  const hasEvidence = data.evidence.length > 0;
  const hasScriptures = bibleVerses.length > 0 || sopWritings.length > 0;

  // Build TOC entries
  let tocIndex = 0;
  const tocEntries: { label: string; anchor: string }[] = [];
  for (const section of renderedSections) {
    tocIndex++;
    tocEntries.push({
      label: `${tocIndex}. ${section.title}`,
      anchor: `section-${section.id}`,
    });
  }
  if (hasInterventions) {
    tocIndex++;
    tocEntries.push({
      label: `${tocIndex}. Interventions`,
      anchor: "interventions",
    });
  }
  if (hasEvidence) {
    tocIndex++;
    tocEntries.push({
      label: `${tocIndex}. Evidence & Research`,
      anchor: "evidence",
    });
  }
  if (hasScriptures) {
    tocIndex++;
    tocEntries.push({
      label: `${tocIndex}. Scripture & Spirit of Prophecy`,
      anchor: "scriptures",
    });
  }

  let sectionCounter = 0;

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
            {tocEntries.map((entry) => (
              <TocItem key={entry.anchor}>
                <TocLink href={`#${entry.anchor}`}>
                  {entry.label}
                </TocLink>
              </TocItem>
            ))}
          </TocList>
        </TableOfContents>

        <Divider />

        {/* === Section Documents === */}
        {renderedSections.map((section) => {
          sectionCounter++;
          return (
            <SectionBlock key={section.id} id={`section-${section.id}`}>
              <SectionNumber>{sectionCounter}</SectionNumber>
              <SectionTitle>{section.title}</SectionTitle>
              <SectionContent>
                <MarkdownContent
                  dangerouslySetInnerHTML={{ __html: section.html }}
                />
              </SectionContent>
            </SectionBlock>
          );
        })}

        {/* === Interventions === */}
        {hasInterventions && (
          <SectionBlock id="interventions">
            <SectionNumber>{++sectionCounter}</SectionNumber>
            <SectionTitle>{t("Interventions")}</SectionTitle>
            <SectionContent>
              {Array.from(interventionsByDomain.entries()).map(
                ([domain, items]) => (
                  <DomainGroup key={domain}>
                    <DomainLabel>{domain}</DomainLabel>
                    <InterventionTable>
                      <thead>
                        <tr>
                          <Th>{t("Intervention")}</Th>
                          <Th>{t("Category")}</Th>
                          <Th>{t("Evidence")}</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((ci) => (
                          <tr key={ci.id}>
                            <Td>
                              <strong>{ci.intervention?.name}</strong>
                              {ci.intervention?.description && (
                                <InterventionDesc>
                                  {ci.intervention.description}
                                </InterventionDesc>
                              )}
                            </Td>
                            <Td>{ci.intervention?.category || "\u2014"}</Td>
                            <Td>
                              {ci.evidenceLevel ? (
                                <EvidenceBadge $level={ci.evidenceLevel}>
                                  {EVIDENCE_LEVEL_LABELS[ci.evidenceLevel] ||
                                    ci.evidenceLevel}
                                </EvidenceBadge>
                              ) : (
                                "\u2014"
                              )}
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </InterventionTable>
                  </DomainGroup>
                )
              )}
            </SectionContent>
          </SectionBlock>
        )}

        {/* === Evidence & Research === */}
        {hasEvidence && (
          <SectionBlock id="evidence">
            <SectionNumber>{++sectionCounter}</SectionNumber>
            <SectionTitle>{t("Evidence & Research")}</SectionTitle>
            <SectionContent>
              {data.evidence.map((entry) => (
                <EvidenceCard key={entry.id}>
                  <EvidenceTitle>
                    {entry.url ? (
                      <a href={entry.url} target="_blank" rel="noopener noreferrer">
                        {entry.title}
                      </a>
                    ) : (
                      entry.title
                    )}
                  </EvidenceTitle>
                  <EvidenceMeta>
                    {entry.authors && <span>{entry.authors}</span>}
                    {entry.journal && (
                      <EvidenceJournal>{entry.journal}</EvidenceJournal>
                    )}
                    {entry.publicationDate && (
                      <span>
                        {new Date(entry.publicationDate).getFullYear()}
                      </span>
                    )}
                    {entry.pubmedId && (
                      <span>PMID: {entry.pubmedId}</span>
                    )}
                    {entry.studyType && <span>{entry.studyType}</span>}
                  </EvidenceMeta>
                  {entry.summary && (
                    <EvidenceSummary>{entry.summary}</EvidenceSummary>
                  )}
                  {entry.abstract && !entry.summary && (
                    <EvidenceAbstract>{entry.abstract}</EvidenceAbstract>
                  )}
                </EvidenceCard>
              ))}
            </SectionContent>
          </SectionBlock>
        )}

        {/* === Scripture & Spirit of Prophecy === */}
        {hasScriptures && (
          <SectionBlock id="scriptures">
            <SectionNumber>{++sectionCounter}</SectionNumber>
            <SectionTitle>{t("Scripture & Spirit of Prophecy")}</SectionTitle>
            <SectionContent>
              {bibleVerses.length > 0 && (
                <ScriptureGroup>
                  <ScriptureGroupTitle>{t("Bible Verses")}</ScriptureGroupTitle>
                  {bibleVerses.map((s) => (
                    <ScriptureCard key={s.id}>
                      <ScriptureRef>{s.reference}</ScriptureRef>
                      <ScriptureText>{s.text}</ScriptureText>
                      {s.theme && (
                        <ScriptureTheme>{t("Theme")}: {s.theme}</ScriptureTheme>
                      )}
                    </ScriptureCard>
                  ))}
                </ScriptureGroup>
              )}
              {sopWritings.length > 0 && (
                <ScriptureGroup>
                  <ScriptureGroupTitle>
                    {t("Spirit of Prophecy")}
                  </ScriptureGroupTitle>
                  {sopWritings.map((s) => (
                    <ScriptureCard key={s.id} $sop>
                      <ScriptureRef>
                        {s.reference}
                        {s.sopSource && ` \u2014 ${s.sopSource}`}
                        {s.sopPage && `, p. ${s.sopPage}`}
                      </ScriptureRef>
                      <ScriptureText>{s.text}</ScriptureText>
                      {s.theme && (
                        <ScriptureTheme>{t("Theme")}: {s.theme}</ScriptureTheme>
                      )}
                    </ScriptureCard>
                  ))}
                </ScriptureGroup>
              )}
            </SectionContent>
          </SectionBlock>
        )}

        {renderedSections.length === 0 &&
          !hasInterventions &&
          !hasEvidence &&
          !hasScriptures && (
            <EmptyState>
              {t("No content has been added to this condition yet.")}
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

  // Interventions
  if (data.interventions.length > 0) {
    lines.push("## Interventions");
    lines.push("");
    for (const ci of data.interventions) {
      const name = ci.intervention?.name ?? "Unknown";
      const level = ci.evidenceLevel
        ? ` (Evidence: ${ci.evidenceLevel})`
        : "";
      const domain = ci.careDomainName ? ` [${ci.careDomainName}]` : "";
      lines.push(`- **${name}**${level}${domain}`);
    }
    lines.push("");
  }

  // Evidence
  if (data.evidence.length > 0) {
    lines.push("## Evidence & Research");
    lines.push("");
    for (const entry of data.evidence) {
      lines.push(`### ${entry.title}`);
      const meta: string[] = [];
      if (entry.authors) {
        meta.push(entry.authors);
      }
      if (entry.journal) {
        meta.push(`*${entry.journal}*`);
      }
      if (entry.publicationDate) {
        meta.push(new Date(entry.publicationDate).getFullYear().toString());
      }
      if (meta.length > 0) {
        lines.push(meta.join(". "));
      }
      if (entry.summary) {
        lines.push("");
        lines.push(entry.summary);
      }
      if (entry.url) {
        lines.push("");
        lines.push(entry.url);
      }
      lines.push("");
    }
  }

  // Scriptures
  const bibleVerses = data.scriptures.filter((s) => !s.spiritOfProphecy);
  const sopWritings = data.scriptures.filter((s) => s.spiritOfProphecy);

  if (bibleVerses.length > 0 || sopWritings.length > 0) {
    lines.push("## Scripture & Spirit of Prophecy");
    lines.push("");
    if (bibleVerses.length > 0) {
      lines.push("### Bible Verses");
      lines.push("");
      for (const s of bibleVerses) {
        lines.push(`> **${s.reference}** \u2014 ${s.text}`);
        lines.push("");
      }
    }
    if (sopWritings.length > 0) {
      lines.push("### Spirit of Prophecy");
      lines.push("");
      for (const s of sopWritings) {
        const source = s.sopSource ? ` (${s.sopSource}${s.sopPage ? `, p. ${s.sopPage}` : ""})` : "";
        lines.push(`> **${s.reference}**${source} \u2014 ${s.text}`);
        lines.push("");
      }
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

// Intervention styles

const DomainGroup = styled.div`
  margin-bottom: 20px;
`;

const DomainLabel = styled.h4`
  font-size: 15px;
  font-weight: 600;
  color: ${s("accent")};
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const InterventionTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const Th = styled.th`
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid ${s("divider")};
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: ${s("textSecondary")};
`;

const Td = styled.td`
  padding: 10px 12px;
  border-bottom: 1px solid ${s("divider")};
  vertical-align: top;
`;

const InterventionDesc = styled.div`
  font-size: 13px;
  color: ${s("textSecondary")};
  margin-top: 2px;
`;

const EvidenceBadge = styled.span<{ $level: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  background: ${(props) =>
    props.$level === "A"
      ? props.theme.noticeSuccessBackground
      : props.$level === "B"
        ? props.theme.noticeInfoBackground
        : props.$level === "C"
          ? props.theme.noticeWarningBackground
          : s("backgroundSecondary")(props)};
  color: ${(props) =>
    props.$level === "A"
      ? props.theme.noticeSuccessText
      : props.$level === "B"
        ? props.theme.noticeInfoText
        : props.$level === "C"
          ? props.theme.noticeWarningText
          : s("textSecondary")(props)};
`;

// Evidence styles

const EvidenceCard = styled.div`
  padding: 16px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  margin-bottom: 12px;
`;

const EvidenceTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
  color: ${s("text")};

  a {
    color: ${s("accent")};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const EvidenceMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: ${s("textSecondary")};
  margin-bottom: 8px;

  span:not(:last-child)::after {
    content: "\u00B7";
    margin-left: 8px;
  }
`;

const EvidenceJournal = styled.span`
  font-style: italic;
`;

const EvidenceSummary = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${s("text")};
  margin: 0;
`;

const EvidenceAbstract = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: ${s("textSecondary")};
  margin: 0;
  max-height: 120px;
  overflow: hidden;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30px;
    background: linear-gradient(transparent, ${s("background")});
  }
`;

// Scripture styles

const ScriptureGroup = styled.div`
  margin-bottom: 20px;
`;

const ScriptureGroupTitle = styled.h4`
  font-size: 15px;
  font-weight: 600;
  color: ${s("textSecondary")};
  margin: 0 0 12px;
`;

const ScriptureCard = styled.blockquote<{ $sop?: boolean }>`
  margin: 0 0 16px;
  padding: 12px 16px;
  border-left: 3px solid ${(props) =>
    props.$sop ? props.theme.noticeInfoText : s("accent")(props)};
  background: ${s("backgroundSecondary")};
  border-radius: 0 6px 6px 0;
`;

const ScriptureRef = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${s("accent")};
  margin-bottom: 4px;
`;

const ScriptureText = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: ${s("text")};
  font-style: italic;
`;

const ScriptureTheme = styled.div`
  font-size: 12px;
  color: ${s("textTertiary")};
  margin-top: 6px;
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
