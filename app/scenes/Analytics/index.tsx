import { observer } from "mobx-react";
import { SettingsIcon } from "outline-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Scene from "~/components/Scene";
import Subheading from "~/components/Subheading";
import Text from "~/components/Text";
import { client } from "~/utils/ApiClient";
import styled from "styled-components";
import { s } from "@shared/styles";

interface DashboardData {
  totals: {
    conditions: number;
    interventions: number;
    evidenceEntries: number;
    scriptures: number;
    recipes: number;
  };
  conditionsByStatus: Array<{ status: string; count: number }>;
}

function Analytics() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await client.post("/analytics.dashboard");
        setData(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  if (isLoading || !data) {
    return (
      <Scene icon={<SettingsIcon />} title={t("Analytics")}>
        <PlaceholderDocument />
      </Scene>
    );
  }

  return (
    <Scene icon={<SettingsIcon />} title={t("Analytics")} wide>
      <Heading>{t("Analytics Dashboard")}</Heading>
      <Text as="p" size="large">
        {t("Overview of your medical knowledge base content and coverage.")}
      </Text>

      <Subheading>{t("Content Overview")}</Subheading>
      <MetricGrid>
        <MetricCard $color="#e63950">
          <MetricValue>{data.totals.conditions}</MetricValue>
          <MetricLabel>{t("Conditions")}</MetricLabel>
        </MetricCard>
        <MetricCard $color="#486581">
          <MetricValue>{data.totals.interventions}</MetricValue>
          <MetricLabel>{t("Interventions")}</MetricLabel>
        </MetricCard>
        <MetricCard $color="#2da77a">
          <MetricValue>{data.totals.evidenceEntries}</MetricValue>
          <MetricLabel>{t("Evidence Entries")}</MetricLabel>
        </MetricCard>
        <MetricCard $color="#6b21a8">
          <MetricValue>{data.totals.scriptures}</MetricValue>
          <MetricLabel>{t("Scriptures")}</MetricLabel>
        </MetricCard>
        <MetricCard $color="#b45309">
          <MetricValue>{data.totals.recipes}</MetricValue>
          <MetricLabel>{t("Recipes")}</MetricLabel>
        </MetricCard>
      </MetricGrid>

      <Subheading>{t("Conditions by Status")}</Subheading>
      <StatusGrid>
        {(data.conditionsByStatus || []).map(
          (item: { status: string; count: number }) => (
            <StatusRow key={item.status}>
              <StatusLabel>{item.status}</StatusLabel>
              <StatusBar>
                <StatusFill
                  $width={
                    data.totals.conditions > 0
                      ? (Number(item.count) / data.totals.conditions) * 100
                      : 0
                  }
                  $status={item.status}
                />
              </StatusBar>
              <StatusCount>{item.count}</StatusCount>
            </StatusRow>
          )
        )}
        {(!data.conditionsByStatus || data.conditionsByStatus.length === 0) && (
          <EmptyHint>{t("No conditions created yet.")}</EmptyHint>
        )}
      </StatusGrid>
    </Scene>
  );
}

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin: 16px 0;
`;

const MetricCard = styled.div<{ $color: string }>`
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid ${(props) => props.$color};
  background: ${s("background")};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

const MetricValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${s("text")};
`;

const MetricLabel = styled.div`
  font-size: 13px;
  color: ${s("textTertiary")};
  margin-top: 4px;
`;

const StatusGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const StatusRow = styled(Flex)`
  align-items: center;
  gap: 12px;
`;

const StatusLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  width: 80px;
  text-transform: capitalize;
  color: ${s("text")};
`;

const StatusBar = styled.div`
  flex: 1;
  height: 20px;
  background: ${s("backgroundSecondary")};
  border-radius: 10px;
  overflow: hidden;
`;

const StatusFill = styled.div<{ $width: number; $status: string }>`
  height: 100%;
  width: ${(props) => props.$width}%;
  border-radius: 10px;
  background: ${(props) =>
    props.$status === "published"
      ? "#2da77a"
      : props.$status === "review"
        ? "#f5be31"
        : "#94a3b8"};
  transition: width 500ms ease;
`;

const StatusCount = styled.span`
  font-size: 14px;
  font-weight: 600;
  width: 40px;
  text-align: right;
  color: ${s("text")};
`;

const EmptyHint = styled.div`
  font-size: 13px;
  color: ${s("textTertiary")};
  font-style: italic;
  padding: 20px 0;
`;

export default observer(Analytics);
