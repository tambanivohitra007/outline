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

interface GraphNode {
  id: string;
  type: "condition" | "intervention" | "careDomain";
  label: string;
  data: Record<string, unknown>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * Build a markdown string from the graph data for markmap rendering.
 * Structure: Knowledge Graph > Care Domains > Interventions > Conditions
 *
 * @param nodes The graph nodes.
 * @param edges The graph edges.
 * @returns A markdown string representing the hierarchy.
 */
function buildMarkdown(nodes: GraphNode[], edges: GraphEdge[]): string {
  const conditions = nodes.filter((n) => n.type === "condition");
  const interventions = nodes.filter((n) => n.type === "intervention");
  const domains = nodes.filter((n) => n.type === "careDomain");

  // Map intervention -> care domain
  const interventionToDomain = new Map<string, string>();
  for (const edge of edges) {
    if (edge.id.startsWith("edge-int-domain-")) {
      interventionToDomain.set(edge.source, edge.target);
    }
  }

  // Map condition -> interventions
  const conditionToInterventions = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.id.startsWith("edge-ci-")) {
      const existing = conditionToInterventions.get(edge.source) ?? [];
      existing.push(edge.target);
      conditionToInterventions.set(edge.source, existing);
    }
  }

  // Map intervention -> conditions that use it
  const interventionToConditions = new Map<string, string[]>();
  for (const [condId, intIds] of conditionToInterventions) {
    for (const intId of intIds) {
      const existing = interventionToConditions.get(intId) ?? [];
      existing.push(condId);
      interventionToConditions.set(intId, existing);
    }
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const lines: string[] = ["# Knowledge Graph"];

  if (domains.length > 0) {
    for (const domain of domains) {
      lines.push(`## ${domain.label}`);

      // Find interventions in this domain
      const domainInterventions = interventions.filter(
        (i) => interventionToDomain.get(i.id) === domain.id
      );

      for (const intervention of domainInterventions) {
        lines.push(`### ${intervention.label}`);

        // Find conditions linked to this intervention
        const linkedConditionIds =
          interventionToConditions.get(intervention.id) ?? [];
        for (const condId of linkedConditionIds) {
          const cond = nodeById.get(condId);
          if (cond) {
            lines.push(`- ${cond.label}`);
          }
        }
      }
    }
  }

  // Interventions without a domain
  const orphanInterventions = interventions.filter(
    (i) => !interventionToDomain.has(i.id)
  );
  if (orphanInterventions.length > 0) {
    lines.push("## Other Interventions");
    for (const intervention of orphanInterventions) {
      lines.push(`### ${intervention.label}`);
      const linkedConditionIds =
        interventionToConditions.get(intervention.id) ?? [];
      for (const condId of linkedConditionIds) {
        const cond = nodeById.get(condId);
        if (cond) {
          lines.push(`- ${cond.label}`);
        }
      }
    }
  }

  // Conditions without any intervention link
  const linkedConditionIds = new Set(
    [...conditionToInterventions.keys()]
  );
  const orphanConditions = conditions.filter(
    (c) => !linkedConditionIds.has(c.id)
  );
  if (orphanConditions.length > 0) {
    lines.push("## Conditions");
    for (const cond of orphanConditions) {
      lines.push(`- ${cond.label}`);
    }
  }

  return lines.join("\n");
}

const transformer = new Transformer();

function KnowledgeGraph() {
  const { t } = useTranslation();
  const history = useHistory();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await client.post("/analytics.graph");
        setNodes(res.data?.nodes ?? []);
        setEdges(res.data?.edges ?? []);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    if (isLoading || !svgRef.current) {
      return;
    }

    const markdown = buildMarkdown(nodes, edges);
    const { root } = transformer.transform(markdown);

    if (markmapRef.current) {
      markmapRef.current.setData(root);
      markmapRef.current.fit();
    } else {
      markmapRef.current = Markmap.create(svgRef.current, {
        autoFit: true,
        duration: 300,
        maxWidth: 300,
        paddingX: 16,
      }, root);
    }
  }, [nodes, edges, isLoading]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === "condition") {
        const conditionId = node.id.replace("condition-", "");
        history.push(conditionPath(conditionId));
      }
    },
    [history]
  );

  const conditionNodes = nodes.filter((n) => n.type === "condition");
  const interventionNodes = nodes.filter((n) => n.type === "intervention");
  const domainNodes = nodes.filter((n) => n.type === "careDomain");

  if (isLoading) {
    return (
      <Scene icon={<GlobeIcon />} title={t("Knowledge Graph")}>
        <PlaceholderDocument />
      </Scene>
    );
  }

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
          <StatNumber>{conditionNodes.length}</StatNumber>
          <StatLabel>{t("Conditions")}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{interventionNodes.length}</StatNumber>
          <StatLabel>{t("Interventions")}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{domainNodes.length}</StatNumber>
          <StatLabel>{t("Care Domains")}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{edges.length}</StatNumber>
          <StatLabel>{t("Connections")}</StatLabel>
        </StatCard>
      </StatsRow>

      <MarkmapContainer>
        <svg ref={svgRef} />
        {nodes.length === 0 && (
          <EmptyState>
            {t(
              "No data available. Create conditions and interventions to populate the knowledge graph."
            )}
          </EmptyState>
        )}
      </MarkmapContainer>

      {conditionNodes.length > 0 && (
        <ConditionList>
          <ConditionListTitle>{t("Conditions")}</ConditionListTitle>
          {conditionNodes.map((node) => (
            <ConditionChip
              key={node.id}
              onClick={() => handleNodeClick(node)}
            >
              {node.label}
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
