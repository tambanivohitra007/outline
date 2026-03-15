import { observer } from "mobx-react";
import { GlobeIcon } from "outline-icons";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Scene from "~/components/Scene";
import { client } from "~/utils/ApiClient";
import { conditionPath } from "~/utils/routeHelpers";
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

    // Sections (risk factors, physiology, complications, etc.)
    for (const section of condition.sections) {
      const label = SECTION_LABELS[section.sectionType] ?? section.title;
      lines.push(`### ${label}`);
    }

    // Interventions grouped by care domain
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

    // Recipes
    if (condition.recipes.length > 0) {
      lines.push("### Recipes");
      for (const recipe of condition.recipes) {
        lines.push(`- ${recipe}`);
      }
    }

    // Scriptures & Spirit of Prophecy
    if (condition.scriptures.length > 0) {
      lines.push("### Scriptures & SOP");
      for (const scripture of condition.scriptures) {
        const sopTag = scripture.spiritOfProphecy ? " *(SOP)*" : "";
        lines.push(`- ${scripture.reference}${sopTag}`);
      }
    }

    // Evidence entries
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
  const history = useHistory();
  const [data, setData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);

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

  if (isLoading) {
    return (
      <Scene icon={<GlobeIcon />} title={t("Knowledge Graph")}>
        <PlaceholderDocument />
      </Scene>
    );
  }

  return (
    <Scene icon={<GlobeIcon />} title={t("Knowledge Graph")} wide>
      <GraphContainer>
        <svg ref={svgRef} />
        {(data?.conditions.length ?? 0) === 0 && (
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

const GraphContainer = styled.div`
  position: relative;
  width: 100%;
  height: calc(100vh - 120px);
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  overflow: hidden;

  svg {
    width: 100%;
    height: 100%;
  }
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
