import { observer } from "mobx-react";
import { GlobeIcon } from "outline-icons";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Scene from "~/components/Scene";
import { client } from "~/utils/ApiClient";
import styled from "styled-components";
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

const transformer = new Transformer();

function KnowledgeGraph() {
  const { t } = useTranslation();
  const [data, setData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

    // Collapse all children beyond level 1
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
      // Re-fit after fullscreen transition
      setTimeout(() => markmapRef.current?.fit(), 100);
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  if (isLoading) {
    return (
      <Scene icon={<GlobeIcon />} title={t("Knowledge Graph")}>
        <PlaceholderDocument />
      </Scene>
    );
  }

  const hasData = (data?.conditions.length ?? 0) > 0;

  return (
    <Scene icon={<GlobeIcon />} title={t("Knowledge Graph")} wide>
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

const GraphContainer = styled.div<{ $isFullscreen: boolean }>`
  position: relative;
  width: 100%;
  height: ${(props) =>
    props.$isFullscreen ? "100vh" : "calc(100vh - 120px)"};
  overflow: hidden;
  background: ${s("background")};

  svg {
    width: 100%;
    height: 100%;
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

export default observer(KnowledgeGraph);
