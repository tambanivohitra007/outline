import { observer } from "mobx-react";
import { GlobeIcon, CloseIcon } from "outline-icons";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Scene from "~/components/Scene";
import { client } from "~/utils/ApiClient";
import styled, { keyframes } from "styled-components";
import { s } from "@shared/styles";

interface ConditionGraph {
  id: string;
  name: string;
  slug: string;
  status: string;
  snomedCode: string | null;
  icdCode: string | null;
  sections: Array<{ sectionType: string; title: string }>;
  interventionGroups: Array<{
    careDomain: string;
    interventions: Array<{ name: string; evidenceLevel: string | null }>;
  }>;
  recipes: string[];
  scriptures: Array<{ reference: string; spiritOfProphecy: boolean }>;
  evidence: string[];
}

interface GraphData {
  conditions: ConditionGraph[];
  careDomains: Array<{
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  }>;
  totals: {
    conditions: number;
    interventions: number;
    careDomains: number;
    recipes: number;
    scriptures: number;
    evidence: number;
  };
}

/** Detail panel content resolved from a clicked node. */
interface NodeDetail {
  title: string;
  type: string;
  fields: Array<{ label: string; value: string }>;
  items?: Array<{ label: string; sublabel?: string }>;
}

/** Human-readable labels for section types. */
const SECTION_LABELS: Record<string, string> = {
  risk_factors: "Risk Factors / Causes",
  physiology: "Physiology & Pathophysiology",
  complications: "Complications",
  solutions: "Solutions",
  bible_sop: "Bible & Spirit of Prophecy",
  research_ideas: "Ideas for Potential Research",
};

/**
 * Build a markdown string from condition-centric graph data for markmap.
 *
 * @param data The graph data from the API.
 * @returns A markdown string for markmap.
 */
function buildMarkdown(data: GraphData): string {
  const lines: string[] = ["# Knowledge Graph"];

  if (data.conditions.length === 0) {
    lines.push("## No conditions yet");
    return lines.join("\n");
  }

  for (const condition of data.conditions) {
    const statusTag = condition.status ? ` *(${condition.status})*` : "";
    lines.push(`## ${condition.name}${statusTag}`);

    for (const section of condition.sections) {
      const label = SECTION_LABELS[section.sectionType] ?? section.title;
      lines.push(`### ${label}`);
    }

    if (condition.interventionGroups.length > 0) {
      lines.push("### Interventions");
      for (const group of condition.interventionGroups) {
        lines.push(`#### ${group.careDomain}`);
        for (const intervention of group.interventions) {
          const suffix = intervention.evidenceLevel
            ? ` *(${intervention.evidenceLevel})*`
            : "";
          lines.push(`- ${intervention.name}${suffix}`);
        }
      }
    }

    if (condition.recipes.length > 0) {
      lines.push("### Recipes");
      for (const recipe of condition.recipes) {
        lines.push(`- ${recipe}`);
      }
    }

    if (condition.scriptures.length > 0) {
      lines.push("### Scriptures & SOP");
      for (const scripture of condition.scriptures) {
        const sopTag = scripture.spiritOfProphecy ? " *(SOP)*" : "";
        lines.push(`- ${scripture.reference}${sopTag}`);
      }
    }

    if (condition.evidence.length > 0) {
      lines.push("### Evidence");
      for (const title of condition.evidence) {
        lines.push(`- ${title}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Strip markdown emphasis from node text (e.g. "Diabetes *(Draft)*" → "Diabetes").
 *
 * @param text Raw text from the markmap node.
 * @returns Clean text without markdown emphasis markers.
 */
function stripMarkdown(text: string): string {
  return text.replace(/\s*\*\(.*?\)\*/g, "").trim();
}

/**
 * Resolve a clicked node's text into a detail object by searching the graph data.
 *
 * @param nodeText The text content of the clicked markmap node.
 * @param data The full graph data.
 * @returns A NodeDetail if a match is found, or null.
 */
function resolveNodeDetail(
  nodeText: string,
  data: GraphData
): NodeDetail | null {
  const clean = stripMarkdown(nodeText);

  // Match condition
  for (const condition of data.conditions) {
    if (condition.name === clean) {
      const fields: NodeDetail["fields"] = [
        { label: "Status", value: condition.status || "—" },
      ];
      if (condition.snomedCode) {
        fields.push({ label: "SNOMED Code", value: condition.snomedCode });
      }
      if (condition.icdCode) {
        fields.push({ label: "ICD Code", value: condition.icdCode });
      }
      fields.push({
        label: "Sections",
        value: String(condition.sections.length),
      });
      fields.push({
        label: "Intervention groups",
        value: String(condition.interventionGroups.length),
      });
      fields.push({
        label: "Recipes",
        value: String(condition.recipes.length),
      });
      fields.push({
        label: "Scriptures",
        value: String(condition.scriptures.length),
      });
      fields.push({
        label: "Evidence",
        value: String(condition.evidence.length),
      });
      return { title: condition.name, type: "Condition", fields };
    }

    // Match care domain under a condition
    for (const group of condition.interventionGroups) {
      if (group.careDomain === clean) {
        return {
          title: group.careDomain,
          type: "Care Domain",
          fields: [
            { label: "Condition", value: condition.name },
            {
              label: "Interventions",
              value: String(group.interventions.length),
            },
          ],
          items: group.interventions.map((iv) => ({
            label: iv.name,
            sublabel: iv.evidenceLevel ?? undefined,
          })),
        };
      }

      // Match individual intervention
      for (const iv of group.interventions) {
        if (iv.name === clean) {
          return {
            title: iv.name,
            type: "Intervention",
            fields: [
              { label: "Condition", value: condition.name },
              { label: "Care Domain", value: group.careDomain },
              { label: "Evidence Level", value: iv.evidenceLevel || "—" },
            ],
          };
        }
      }
    }

    // Match recipe
    for (const recipe of condition.recipes) {
      if (recipe === clean) {
        return {
          title: recipe,
          type: "Recipe",
          fields: [{ label: "Condition", value: condition.name }],
        };
      }
    }

    // Match scripture
    for (const scripture of condition.scriptures) {
      if (scripture.reference === clean) {
        return {
          title: scripture.reference,
          type: scripture.spiritOfProphecy
            ? "Spirit of Prophecy"
            : "Scripture",
          fields: [
            { label: "Condition", value: condition.name },
            {
              label: "Spirit of Prophecy",
              value: scripture.spiritOfProphecy ? "Yes" : "No",
            },
          ],
        };
      }
    }

    // Match evidence
    for (const title of condition.evidence) {
      if (title === clean) {
        return {
          title,
          type: "Evidence",
          fields: [{ label: "Condition", value: condition.name }],
        };
      }
    }
  }

  // Match section labels
  const sectionLabelValues = Object.values(SECTION_LABELS);
  if (sectionLabelValues.includes(clean)) {
    // Find which condition owns this section
    const sectionKey = Object.entries(SECTION_LABELS).find(
      ([, v]) => v === clean
    )?.[0];
    for (const condition of data.conditions) {
      const section = condition.sections.find(
        (sec) => sec.sectionType === sectionKey || sec.title === clean
      );
      if (section) {
        return {
          title: clean,
          type: "Section",
          fields: [
            { label: "Condition", value: condition.name },
            { label: "Section Type", value: section.sectionType },
          ],
        };
      }
    }
  }

  return null;
}

/**
 * Check whether a node text resolves to a detail (without building the full object).
 *
 * @param nodeText The text content of a markmap node.
 * @param data The full graph data.
 * @returns True if the node has viewable detail.
 */
function hasNodeDetail(nodeText: string, data: GraphData): boolean {
  return resolveNodeDetail(nodeText, data) !== null;
}

/**
 * Walk all visible markmap nodes in the SVG and tag those with detail
 * by adding a `data-has-detail` attribute. CSS uses this to show an indicator.
 *
 * @param svg The SVG element containing the markmap.
 * @param data The full graph data.
 */
function tagDetailNodes(svg: SVGSVGElement, data: GraphData) {
  const nodes = svg.querySelectorAll(".markmap-node");
  nodes.forEach((node) => {
    const fo = node.querySelector("foreignObject");
    const text = fo?.textContent?.trim();
    if (text && hasNodeDetail(text, data)) {
      node.setAttribute("data-has-detail", "true");
    } else {
      node.removeAttribute("data-has-detail");
    }
  });
}

const transformer = new Transformer();

function KnowledgeGraph() {
  const { t } = useTranslation();
  const [data, setData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detail, setDetail] = useState<NodeDetail | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await client.post("/analytics.graph");
        setData(res.data ?? null);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    if (isLoading || !svgRef.current || !data) {
      return;
    }

    const markdown = buildMarkdown(data);
    const { root } = transformer.transform(markdown);

    if (markmapRef.current) {
      markmapRef.current.setData(root);
      markmapRef.current.fit();
    } else {
      markmapRef.current = Markmap.create(
        svgRef.current,
        {
          autoFit: true,
          duration: 300,
          maxWidth: 300,
          paddingX: 16,
          initialExpandLevel: 1,
        },
        root
      );
    }
  }, [data, isLoading]);

  // Tag nodes that have detail and observe DOM changes (expand/collapse)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !data) {
      return;
    }

    // Initial tagging after a short delay for markmap to finish rendering
    const timer = setTimeout(() => tagDetailNodes(svg, data), 350);

    // Re-tag when markmap mutates the DOM (node expand/collapse)
    const observer = new MutationObserver(() => {
      tagDetailNodes(svg, data);
    });
    observer.observe(svg, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [data, isLoading]);

  // Listen for clicks on markmap nodes inside the SVG
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !data) {
      return;
    }

    function handleClick(e: MouseEvent) {
      const target = e.target as Element;
      // Walk up to find the markmap-node group
      const nodeGroup = target.closest(".markmap-node");
      if (!nodeGroup) {
        return;
      }

      // Extract text from the foreignObject content
      const fo = nodeGroup.querySelector("foreignObject");
      const text = fo?.textContent?.trim();
      if (!text || !data) {
        return;
      }

      const resolved = resolveNodeDetail(text, data);
      if (resolved) {
        setDetail(resolved);
      }
    }

    svg.addEventListener("click", handleClick);
    return () => svg.removeEventListener("click", handleClick);
  }, [data]);

  const handleCloseDetail = useCallback(() => {
    setDetail(null);
  }, []);

  const handleZoomIn = useCallback(() => {
    markmapRef.current?.rescale(1.25);
  }, []);

  const handleZoomOut = useCallback(() => {
    markmapRef.current?.rescale(0.8);
  }, []);

  const handleFitToView = useCallback(() => {
    markmapRef.current?.fit();
  }, []);

  const handleExpandAll = useCallback(() => {
    if (!data) {
      return;
    }
    const markdown = buildMarkdown(data);
    const { root } = transformer.transform(markdown);
    markmapRef.current?.setData(root);
    markmapRef.current?.fit();
  }, [data]);

  const handleCollapseAll = useCallback(() => {
    if (!data) {
      return;
    }
    const markdown = buildMarkdown(data);
    const { root } = transformer.transform(markdown);

    function collapse(node: typeof root, depth: number) {
      if (depth >= 1 && node.children) {
        node.payload = { ...node.payload, fold: 1 };
        node.children.forEach((child) => collapse(child, depth + 1));
      }
    }
    collapse(root, 0);

    markmapRef.current?.setData(root);
    markmapRef.current?.fit();
  }, [data]);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => markmapRef.current?.fit(), 100);
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  // Close panel on Escape
  useEffect(() => {
    if (!detail) {
      return;
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDetail(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [detail]);

  if (isLoading) {
    return (
      <Scene icon={<GlobeIcon />} title={t("Knowledge Graph")}>
        <PlaceholderDocument />
      </Scene>
    );
  }

  const hasData = (data?.conditions.length ?? 0) > 0;

  return (
    <Scene icon={<GlobeIcon />} title={t("Knowledge Graph")} centered={false}>
      <GraphContainer ref={containerRef} $isFullscreen={isFullscreen}>
        {hasData && (
          <Toolbar>
            <ToolbarButton onClick={handleZoomIn} title={t("Zoom in")}>
              <ToolbarIcon>+</ToolbarIcon>
            </ToolbarButton>
            <ToolbarButton onClick={handleZoomOut} title={t("Zoom out")}>
              <ToolbarIcon>&minus;</ToolbarIcon>
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton onClick={handleFitToView} title={t("Fit to view")}>
              <ToolbarIcon>
                <FitIcon />
              </ToolbarIcon>
            </ToolbarButton>
            <ToolbarButton onClick={handleExpandAll} title={t("Expand all")}>
              <ToolbarIcon>
                <ExpandIcon />
              </ToolbarIcon>
            </ToolbarButton>
            <ToolbarButton
              onClick={handleCollapseAll}
              title={t("Collapse all")}
            >
              <ToolbarIcon>
                <CollapseIcon />
              </ToolbarIcon>
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton
              onClick={handleFullscreen}
              title={
                isFullscreen ? t("Exit fullscreen") : t("Enter fullscreen")
              }
            >
              <ToolbarIcon>
                {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </ToolbarIcon>
            </ToolbarButton>
          </Toolbar>
        )}
        <svg ref={svgRef} />
        {!hasData && (
          <EmptyState>
            {t(
              "No data available. Create conditions and interventions to populate the knowledge graph."
            )}
          </EmptyState>
        )}

        {detail && (
          <>
            <PanelOverlay onClick={handleCloseDetail} />
            <DetailPanel>
              <PanelHeader>
                <PanelTypeBadge>{detail.type}</PanelTypeBadge>
                <PanelCloseButton onClick={handleCloseDetail} title={t("Close")}>
                  <CloseIcon />
                </PanelCloseButton>
              </PanelHeader>
              <PanelTitle>{detail.title}</PanelTitle>
              <PanelFields>
                {detail.fields.map((field) => (
                  <PanelField key={field.label}>
                    <PanelFieldLabel>{field.label}</PanelFieldLabel>
                    <PanelFieldValue>{field.value}</PanelFieldValue>
                  </PanelField>
                ))}
              </PanelFields>
              {detail.items && detail.items.length > 0 && (
                <PanelItemsSection>
                  <PanelItemsTitle>
                    {detail.type === "Care Domain"
                      ? t("Interventions")
                      : t("Items")}
                  </PanelItemsTitle>
                  {detail.items.map((item, i) => (
                    <PanelItem key={i}>
                      <PanelItemLabel>{item.label}</PanelItemLabel>
                      {item.sublabel && (
                        <PanelItemSublabel>{item.sublabel}</PanelItemSublabel>
                      )}
                    </PanelItem>
                  ))}
                </PanelItemsSection>
              )}
            </DetailPanel>
          </>
        )}
      </GraphContainer>
    </Scene>
  );
}

/** Inline SVG icons for toolbar buttons */
function FitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h4V0H1a1 1 0 00-1 1v5h2V2zM14 2h-4V0h5a1 1 0 011 1v5h-2V2zM14 14h-4v2h5a1 1 0 001-1v-5h-2v4zM2 14h4v2H1a1 1 0 01-1-1v-5h2v4z" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1v6h6V5.5L11.5 8 14 5.5V7H8V1zM1 8h6v6H5.5L8 11.5 5.5 14H7V8H1z" />
      <path d="M2 2h5v2H4v3H2V2zM9 2h5v5h-2V4H9V2zM2 9h2v3h3v2H2V9zM14 14H9v-2h3V9h2v5z" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5 1v4H1v2h6V1H5zM11 1v6h-1V3.5L7.5 6 6 4.5 8.5 2H5V1h6zM1 9h4v6H3v-4H1V9zM15 9h-4v2h2v3h-3v2h6V9h-1z" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 0h6v2H2v4H0V0zM10 0h6v6h-2V2h-4V0zM16 10v6h-6v-2h4v-4h2zM0 10h2v4h4v2H0v-6z" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6 0v2H2v4H0V0h6zM0 10h2v4h4v2H0v-6zM10 16h6v-6h-2v4h-4v2zM16 6h-2V2h-4V0h6v6z" />
      <path d="M5 5H1V7h6V1H5v4zM11 5h4V7h-6V1h2v4zM5 11H1V9h6v6H5v-4zM11 11h4V9h-6v6h2v-4z" />
    </svg>
  );
}

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const GraphContainer = styled.div<{ $isFullscreen: boolean }>`
  position: ${(props) => (props.$isFullscreen ? "fixed" : "absolute")};
  top: ${(props) => (props.$isFullscreen ? "0" : "64px")};
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: ${s("background")};
  ${(props) => props.$isFullscreen && "z-index: 100;"}

  svg {
    width: 100%;
    height: 100%;
  }

  .markmap-node[data-has-detail] foreignObject {
    cursor: pointer;
  }

  .markmap-node[data-has-detail] foreignObject > div::after {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    background: ${s("accent")};
    border-radius: 50%;
    margin-left: 6px;
    vertical-align: middle;
    flex-shrink: 0;
  }
`;

const Toolbar = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: ${s("backgroundSecondary")};
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${s("textSecondary")};
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    background: ${s("backgroundTertiary")};
    color: ${s("text")};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ToolbarIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
`;

const ToolbarDivider = styled.div`
  width: 1px;
  height: 20px;
  margin: 0 4px;
  background: ${s("divider")};
`;

const EmptyState = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${s("textTertiary")};
  font-size: 14px;
`;

const PanelOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.15);
`;

const DetailPanel = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  max-width: 90%;
  z-index: 21;
  background: ${s("background")};
  border-left: 1px solid ${s("divider")};
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  padding: 20px 24px;
  overflow-y: auto;
  animation: ${slideIn} 200ms ease-out;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const PanelTypeBadge = styled.span`
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 12px;
  background: ${s("accent")};
  color: white;
`;

const PanelCloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${s("textTertiary")};
  cursor: pointer;

  &:hover {
    background: ${s("backgroundSecondary")};
    color: ${s("text")};
  }
`;

const PanelTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${s("text")};
  margin: 0 0 20px;
`;

const PanelFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PanelField = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px solid ${s("divider")};
`;

const PanelFieldLabel = styled.span`
  font-size: 13px;
  color: ${s("textTertiary")};
`;

const PanelFieldValue = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${s("text")};
`;

const PanelItemsSection = styled.div`
  margin-top: 24px;
`;

const PanelItemsTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${s("textTertiary")};
  margin-bottom: 12px;
`;

const PanelItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  background: ${s("backgroundSecondary")};
  margin-bottom: 6px;
`;

const PanelItemLabel = styled.span`
  font-size: 13px;
  color: ${s("text")};
`;

const PanelItemSublabel = styled.span`
  font-size: 11px;
  color: ${s("textTertiary")};
  background: ${s("backgroundTertiary")};
  padding: 2px 8px;
  border-radius: 10px;
`;

export default observer(KnowledgeGraph);
