import { observer } from "mobx-react";
import { GlobeIcon } from "outline-icons";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
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

function KnowledgeGraph() {
  const { t } = useTranslation();
  const history = useHistory();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

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

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === "condition") {
        const conditionId = node.id.replace("condition-", "");
        history.push(conditionPath(conditionId));
      }
    },
    [history]
  );

  const filteredNodes = selectedType
    ? nodes.filter((n) => n.type === selectedType)
    : nodes;

  if (isLoading) {
    return (
      <Scene icon={<GlobeIcon />} title={t("Knowledge Graph")}>
        <PlaceholderDocument />
      </Scene>
    );
  }

  const conditionNodes = nodes.filter((n) => n.type === "condition");
  const interventionNodes = nodes.filter((n) => n.type === "intervention");
  const domainNodes = nodes.filter((n) => n.type === "careDomain");

  return (
    <Scene icon={<GlobeIcon />} title={t("Knowledge Graph")} wide>
      <Heading>{t("Knowledge Graph")}</Heading>
      <Text as="p" size="large">
        {t(
          "Visual map of conditions, interventions, and care domains in your knowledge base."
        )}
      </Text>

      <StatsRow>
        <StatCard onClick={() => setSelectedType(selectedType === "condition" ? null : "condition")}>
          <StatNumber>{conditionNodes.length}</StatNumber>
          <StatLabel>{t("Conditions")}</StatLabel>
        </StatCard>
        <StatCard onClick={() => setSelectedType(selectedType === "intervention" ? null : "intervention")}>
          <StatNumber>{interventionNodes.length}</StatNumber>
          <StatLabel>{t("Interventions")}</StatLabel>
        </StatCard>
        <StatCard onClick={() => setSelectedType(selectedType === "careDomain" ? null : "careDomain")}>
          <StatNumber>{domainNodes.length}</StatNumber>
          <StatLabel>{t("Care Domains")}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{edges.length}</StatNumber>
          <StatLabel>{t("Connections")}</StatLabel>
        </StatCard>
      </StatsRow>

      <GraphContainer>
        <GraphView>
          {filteredNodes.map((node) => (
            <NodeCard
              key={node.id}
              $type={node.type}
              onClick={() => handleNodeClick(node)}
            >
              <NodeIcon $type={node.type}>
                {node.type === "condition" ? "\ud83e\udde0" : node.type === "intervention" ? "\ud83d\udee0\ufe0f" : "\ud83c\udf1f"}
              </NodeIcon>
              <NodeLabel>{node.label}</NodeLabel>
              <NodeType>{node.type.replace("careDomain", "care domain")}</NodeType>
            </NodeCard>
          ))}
        </GraphView>

        {filteredNodes.length === 0 && (
          <EmptyState>
            {t("No data available. Create conditions and interventions to populate the knowledge graph.")}
          </EmptyState>
        )}
      </GraphContainer>
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
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    border-color: ${s("accent")};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
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

const GraphContainer = styled.div`
  min-height: 400px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  padding: 24px;
  margin-top: 16px;
`;

const GraphView = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
`;

const NodeCard = styled.div<{ $type: string }>`
  padding: 12px;
  border: 2px solid
    ${(props) =>
      props.$type === "condition"
        ? "#e63950"
        : props.$type === "intervention"
          ? "#486581"
          : "#f5be31"};
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 150ms ease;
  background: ${(props) =>
    props.$type === "condition"
      ? "#fef2f3"
      : props.$type === "intervention"
        ? "#f0f4f8"
        : "#fffbeb"};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const NodeIcon = styled.div<{ $type: string }>`
  font-size: 24px;
  margin-bottom: 6px;
`;

const NodeLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${s("text")};
  line-height: 1.3;
`;

const NodeType = styled.div`
  font-size: 11px;
  color: ${s("textTertiary")};
  margin-top: 4px;
  text-transform: capitalize;
`;

const EmptyState = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: ${s("textTertiary")};
  font-size: 14px;
`;

export default observer(KnowledgeGraph);
