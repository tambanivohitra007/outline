import { SettingsIcon } from "outline-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { s } from "@shared/styles";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import Notice from "~/components/Notice";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Scene from "~/components/Scene";
import Subheading from "~/components/Subheading";
import Text from "~/components/Text";
import { client } from "~/utils/ApiClient";
import { conditionPath } from "~/utils/routeHelpers";

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

interface CoverageData {
  conditionCoverage: Array<{
    id: string;
    name: string;
    status: string;
    totalSections: number;
    sectionsWithDocs: number;
    completionPct: number;
  }>;
  evidenceCoverage: Array<{
    id: string;
    name: string;
    evidenceCount: number;
  }>;
  domainBreakdown: Array<{
    id: string;
    name: string;
    color: string | null;
    interventionCount: number;
  }>;
}

function Analytics() {
  const { t } = useTranslation();
  const history = useHistory();
  const [data, setData] = useState<DashboardData | null>(null);
  const [coverage, setCoverage] = useState<CoverageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [dashRes, covRes] = await Promise.all([
          client.post("/analytics.dashboard"),
          client.post("/analytics.coverage"),
        ]);
        setData(dashRes.data);
        setCoverage(covRes.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("Failed to load analytics data.")
        );
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [t]);

  const maxEvidence = useMemo(
    () =>
      coverage
        ? Math.max(...coverage.evidenceCoverage.map((e) => e.evidenceCount), 1)
        : 1,
    [coverage]
  );

  const totalDomainInterventions = useMemo(
    () =>
      coverage
        ? coverage.domainBreakdown.reduce((sum, d) => sum + d.interventionCount, 0)
        : 0,
    [coverage]
  );

  if (isLoading || !data) {
    return (
      <Scene icon={<SettingsIcon />} title={t("Analytics")}>
        <PlaceholderDocument />
      </Scene>
    );
  }

  if (error) {
    return (
      <Scene icon={<SettingsIcon />} title={t("Analytics")}>
        <Notice>{error}</Notice>
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

      {coverage && coverage.conditionCoverage.length > 0 && (
        <>
          <Subheading>{t("Section Completion")}</Subheading>
          <Text as="p" size="small" type="tertiary">
            {t("Percentage of sections with linked documents per condition.")}
          </Text>
          <CoverageGrid>
            {coverage.conditionCoverage.map((c) => (
              <CoverageRow
                key={c.id}
                onClick={() => history.push(conditionPath(c.id))}
              >
                <CoverageLabel>
                  <CoverageName>{c.name}</CoverageName>
                  <CoverageStatus $status={c.status}>{c.status}</CoverageStatus>
                </CoverageLabel>
                <CoverageBarWrapper>
                  <CoverageBar>
                    <CoverageFill $pct={c.completionPct} />
                  </CoverageBar>
                  <CoveragePct>{c.completionPct}%</CoveragePct>
                </CoverageBarWrapper>
                <CoverageDetail>
                  {c.sectionsWithDocs}/{c.totalSections} {t("sections")}
                </CoverageDetail>
              </CoverageRow>
            ))}
          </CoverageGrid>
        </>
      )}

      {coverage && coverage.evidenceCoverage.length > 0 && (
        <>
          <Subheading>{t("Evidence per Condition")}</Subheading>
          <CoverageGrid>
            {coverage.evidenceCoverage.map((e) => (
              <EvidenceRow
                key={e.id}
                onClick={() => history.push(conditionPath(e.id))}
              >
                <EvidenceLabel>{e.name}</EvidenceLabel>
                <EvidenceBarWrapper>
                  <EvidenceBar>
                    <EvidenceFill
                      $pct={(e.evidenceCount / maxEvidence) * 100}
                    />
                  </EvidenceBar>
                  <EvidenceCount>{e.evidenceCount}</EvidenceCount>
                </EvidenceBarWrapper>
              </EvidenceRow>
            ))}
          </CoverageGrid>
        </>
      )}

      {coverage && coverage.domainBreakdown.length > 0 && (
        <>
          <Subheading>{t("Interventions by Care Domain")}</Subheading>
          <DomainGrid>
            {coverage.domainBreakdown.map((d) => (
              <DomainCard key={d.id} $color={d.color ?? "#486581"}>
                <DomainName>{d.name}</DomainName>
                <DomainCount>{d.interventionCount}</DomainCount>
                <DomainBarBg>
                  <DomainBarFill
                    $pct={
                      totalDomainInterventions > 0
                        ? (d.interventionCount / totalDomainInterventions) * 100
                        : 0
                    }
                    $color={d.color ?? "#486581"}
                  />
                </DomainBarBg>
              </DomainCard>
            ))}
          </DomainGrid>
        </>
      )}
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

/* Section Completion */

const CoverageGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
`;

const CoverageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 100ms ease;

  &:hover {
    background: ${s("listItemHoverBackground")};
  }
`;

const CoverageLabel = styled.div`
  width: 200px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CoverageName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${s("text")};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CoverageStatus = styled.span<{ $status: string }>`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
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

const CoverageBarWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CoverageBar = styled.div`
  flex: 1;
  height: 16px;
  background: ${s("backgroundSecondary")};
  border-radius: 8px;
  overflow: hidden;
`;

const CoverageFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(props) => props.$pct}%;
  border-radius: 8px;
  background: ${(props) =>
    props.$pct >= 80 ? "#2da77a" : props.$pct >= 40 ? "#f5be31" : "#e63950"};
  transition: width 500ms ease;
`;

const CoveragePct = styled.span`
  font-size: 13px;
  font-weight: 600;
  width: 40px;
  text-align: right;
  color: ${s("text")};
`;

const CoverageDetail = styled.span`
  font-size: 12px;
  color: ${s("textTertiary")};
  width: 80px;
  text-align: right;
  flex-shrink: 0;
`;

/* Evidence per Condition */

const EvidenceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: ${s("listItemHoverBackground")};
  }
`;

const EvidenceLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${s("text")};
  width: 200px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EvidenceBarWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EvidenceBar = styled.div`
  flex: 1;
  height: 14px;
  background: ${s("backgroundSecondary")};
  border-radius: 7px;
  overflow: hidden;
`;

const EvidenceFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(props) => props.$pct}%;
  border-radius: 7px;
  background: #2da77a;
  transition: width 500ms ease;
`;

const EvidenceCount = styled.span`
  font-size: 13px;
  font-weight: 600;
  width: 30px;
  text-align: right;
  color: ${s("text")};
`;

/* Care Domain Breakdown */

const DomainGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 8px;
`;

const DomainCard = styled.div<{ $color: string }>`
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid ${(props) => props.$color};
  background: ${s("background")};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const DomainName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${s("text")};
  margin-bottom: 4px;
`;

const DomainCount = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${s("text")};
  margin-bottom: 8px;
`;

const DomainBarBg = styled.div`
  height: 6px;
  background: ${s("backgroundSecondary")};
  border-radius: 3px;
  overflow: hidden;
`;

const DomainBarFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%;
  width: ${(props) => props.$pct}%;
  border-radius: 3px;
  background: ${(props) => props.$color};
  transition: width 500ms ease;
`;

export default Analytics;
