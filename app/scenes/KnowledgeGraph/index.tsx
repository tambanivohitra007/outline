import { observer } from "mobx-react";
import { GlobeIcon } from "outline-icons";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Scene from "~/components/Scene";
import Text from "~/components/Text";
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
  sections: Array<{ sectionType: string; title: string }>;
  interventionGroups: Array<{
    careDomain: string;
    interventions: Array<{ name: string; evidenceLevel: string | null }>;
  }>;
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
    links: number;
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
 * Structure:
 *   Knowledge Graph
 *   └─ Condition
 *      ├─ Overview
 *      ├─ Risk Factors / Causes
 *      ├─ Physiology & Pathophysiology
 *      ├─ Complications
 *      └─ Interventions
 *         ├─ Care Domain A
 *         │  ├─ Intervention 1
 *         │  └─ Intervention 2
 *         └─ Care Domain B
 *            └─ Intervention 3
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
    lines.push(`## ${condition.name}`);

    // Overview
    const overviewParts: string[] = [];
    if (condition.status) {
      overviewParts.push(`Status: ${condition.status}`);
    }
    if (condition.snomedCode) {
      overviewParts.push(`SNOMED: ${condition.snomedCode}`);
    }
    lines.push("### Overview");
    if (overviewParts.length > 0) {
      for (const part of overviewParts) {
        lines.push(`- ${part}`);
      }
    }

    // Sections (risk factors, physiology, complications, etc.)
    for (const section of condition.sections) {
      const label =
        SECTION_LABELS[section.sectionType] ?? section.title;
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
        },
        root
      );
    }
  }, [data, isLoading]);

  const handleConditionClick = useCallback(
    (conditionId: string) => {
      history.push(conditionPath(conditionId));
    },
    [history]
  );

  if (isLoading) {
    return (
      <Scene icon={<GlobeIcon />} title={t("Knowledge Graph")}>
        <PlaceholderDocument />
      </Scene>
    );
  }

  const totals = data?.totals ?? {
    conditions: 0,
    interventions: 0,
    careDomains: 0,
    links: 0,
  };

  return (
    <Scene icon={<GlobeIcon />} title={t("Knowledge Graph")} wide>
      <Heading>{t("Knowledge Graph")}</Heading>
      <Text as="p" size="large">
        {t(
          "Visual map of conditions, interventions, and care domains in your knowledge base."
        )}
      </Text>

      <StatsRow>
        <StatCard>
          <StatNumber>{totals.conditions}</StatNumber>
          <StatLabel>{t("Conditions")}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{totals.interventions}</StatNumber>
          <StatLabel>{t("Interventions")}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{totals.careDomains}</StatNumber>
          <StatLabel>{t("Care Domains")}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{totals.links}</StatNumber>
          <StatLabel>{t("Connections")}</StatLabel>
        </StatCard>
      </StatsRow>

      <MarkmapContainer>
        <svg ref={svgRef} />
        {(data?.conditions.length ?? 0) === 0 && (
          <EmptyState>
            {t(
              "No data available. Create conditions and interventions to populate the knowledge graph."
            )}
          </EmptyState>
        )}
      </MarkmapContainer>

      {(data?.conditions.length ?? 0) > 0 && (
        <ConditionList>
          <ConditionListTitle>{t("Quick navigation")}</ConditionListTitle>
          {data?.conditions.map((condition) => (
            <ConditionChip
              key={condition.id}
              onClick={() => handleConditionClick(condition.id)}
            >
              {condition.name}
            </ConditionChip>
          ))}
        </ConditionList>
      )}
    </Scene>
  );
}

const StatsRow = styled(Flex)`
  gap: 16px;
  margin: 16px 0;
  flex-wrap: wrap;
`;

const StatCard = styled.div`
  flex: 1;
  min-width: 120px;
  padding: 16px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${s("accent")};
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${s("textTertiary")};
  margin-top: 4px;
`;

const MarkmapContainer = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  margin-top: 16px;
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

const ConditionList = styled.div`
  margin-top: 16px;
`;

const ConditionListTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${s("textTertiary")};
  margin-bottom: 8px;
`;

const ConditionChip = styled.button`
  display: inline-block;
  padding: 6px 12px;
  margin: 0 8px 8px 0;
  border: 1px solid ${s("divider")};
  border-radius: 16px;
  background: ${s("secondaryBackground")};
  color: ${s("text")};
  font-size: 13px;
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    border-color: ${s("accent")};
    background: ${s("background")};
  }
`;

export default observer(KnowledgeGraph);
