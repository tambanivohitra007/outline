import { SettingsIcon } from "outline-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { s } from "@shared/styles";
import Notice from "~/components/Notice";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Scene from "~/components/Scene";
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

const STATUS_COLORS: Record<string, string> = {
  published: "#16a34a",
  review: "#d97706",
  draft: "#64748b",
};

function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? "#64748b";
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
          err instanceof Error
            ? err.message
            : t("Failed to load analytics data.")
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
        ? Math.max(
            ...coverage.evidenceCoverage.map((e) => e.evidenceCount),
            1
          )
        : 1,
    [coverage]
  );

  const totalDomainInterventions = useMemo(
    () =>
      coverage
        ? coverage.domainBreakdown.reduce(
            (sum, d) => sum + d.interventionCount,
            0
          )
        : 0,
    [coverage]
  );

  const totalConditions = data?.totals.conditions ?? 0;

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

  const metrics = [
    {
      value: data.totals.conditions,
      label: t("Conditions"),
      color: "#e63950",
    },
    {
      value: data.totals.interventions,
      label: t("Interventions"),
      color: "#3b82f6",
    },
    {
      value: data.totals.evidenceEntries,
      label: t("Evidence"),
      color: "#16a34a",
    },
    {
      value: data.totals.scriptures,
      label: t("Scriptures"),
      color: "#8b5cf6",
    },
    { value: data.totals.recipes, label: t("Recipes"), color: "#ea580c" },
  ];

  return (
    <Scene icon={<SettingsIcon />} title={t("Analytics")} wide>
      <Page>
        {/* ── Metrics ── */}
        <MetricStrip>
          {metrics.map((m) => (
            <Metric key={m.label}>
              <MetricValue style={{ color: m.color }}>{m.value}</MetricValue>
              <MetricLabel>{m.label}</MetricLabel>
            </Metric>
          ))}
        </MetricStrip>

        <Columns>
          {/* ── Left column ── */}
          <Column>
            {/* Status breakdown */}
            <Card>
              <CardTitle>{t("Status breakdown")}</CardTitle>
              {(data.conditionsByStatus ?? []).length === 0 ? (
                <Empty>{t("No conditions created yet.")}</Empty>
              ) : (
                <StatusList>
                  {data.conditionsByStatus.map((item) => {
                    const pct =
                      totalConditions > 0
                        ? (item.count / totalConditions) * 100
                        : 0;
                    return (
                      <StatusItem key={item.status}>
                        <StatusHeader>
                          <StatusDot $color={statusColor(item.status)} />
                          <StatusName>{item.status}</StatusName>
                          <StatusMeta>
                            {item.count}
                            <StatusPct>{Math.round(pct)}%</StatusPct>
                          </StatusMeta>
                        </StatusHeader>
                        <BarTrack>
                          <BarFill
                            $pct={pct}
                            $color={statusColor(item.status)}
                          />
                        </BarTrack>
                      </StatusItem>
                    );
                  })}
                </StatusList>
              )}
            </Card>

            {/* Care domains */}
            {coverage && coverage.domainBreakdown.length > 0 && (
              <Card>
                <CardTitle>{t("Care domains")}</CardTitle>
                <DomainList>
                  {coverage.domainBreakdown.map((d) => {
                    const pct =
                      totalDomainInterventions > 0
                        ? (d.interventionCount / totalDomainInterventions) * 100
                        : 0;
                    const color = d.color ?? "#3b82f6";
                    return (
                      <DomainItem key={d.id}>
                        <DomainRow>
                          <DomainDot $color={color} />
                          <DomainName>{d.name}</DomainName>
                          <DomainCount>
                            {d.interventionCount}
                          </DomainCount>
                        </DomainRow>
                        <BarTrack $thin>
                          <BarFill $pct={pct} $color={color} />
                        </BarTrack>
                      </DomainItem>
                    );
                  })}
                </DomainList>
              </Card>
            )}
          </Column>

          {/* ── Right column ── */}
          <Column>
            {/* Section completion */}
            {coverage && coverage.conditionCoverage.length > 0 && (
              <Card>
                <CardTitle>{t("Section completion")}</CardTitle>
                <CompletionList>
                  {coverage.conditionCoverage.map((c) => (
                    <CompletionItem
                      key={c.id}
                      onClick={() => history.push(conditionPath(c.id))}
                    >
                      <CompletionTop>
                        <CompletionName>{c.name}</CompletionName>
                        <CompletionValues>
                          <CompletionPct $pct={c.completionPct}>
                            {c.completionPct}%
                          </CompletionPct>
                          <CompletionFraction>
                            {c.sectionsWithDocs}/{c.totalSections}
                          </CompletionFraction>
                        </CompletionValues>
                      </CompletionTop>
                      <BarTrack $thin>
                        <BarFill
                          $pct={c.completionPct}
                          $color={
                            c.completionPct >= 80
                              ? "#16a34a"
                              : c.completionPct >= 40
                                ? "#d97706"
                                : "#e63950"
                          }
                        />
                      </BarTrack>
                    </CompletionItem>
                  ))}
                </CompletionList>
              </Card>
            )}

            {/* Evidence coverage */}
            {coverage && coverage.evidenceCoverage.length > 0 && (
              <Card>
                <CardTitle>{t("Evidence coverage")}</CardTitle>
                <EvidenceList>
                  {coverage.evidenceCoverage.map((e) => (
                    <EvidenceItem
                      key={e.id}
                      onClick={() => history.push(conditionPath(e.id))}
                    >
                      <EvidenceTop>
                        <EvidenceName>{e.name}</EvidenceName>
                        <EvidenceCount>{e.evidenceCount}</EvidenceCount>
                      </EvidenceTop>
                      <BarTrack $thin>
                        <BarFill
                          $pct={(e.evidenceCount / maxEvidence) * 100}
                          $color="#16a34a"
                        />
                      </BarTrack>
                    </EvidenceItem>
                  ))}
                </EvidenceList>
              </Card>
            )}
          </Column>
        </Columns>
      </Page>
    </Scene>
  );
}

/* ── Layout ── */

const Page = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 8px 0 60px;
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/* ── Metrics strip ── */

const MetricStrip = styled.div`
  display: flex;
  gap: 1px;
  background: ${s("divider")};
  border-radius: 10px;
  overflow: hidden;
`;

const Metric = styled.div`
  flex: 1;
  padding: 20px 16px;
  background: ${s("background")};
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

const MetricLabel = styled.div`
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${s("textTertiary")};
  margin-top: 6px;
`;

/* ── Card ── */

const Card = styled.div`
  background: ${s("background")};
  border: 1px solid ${s("divider")};
  border-radius: 10px;
  padding: 20px;
`;

const CardTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${s("textTertiary")};
  margin: 0 0 16px;
`;

/* ── Shared bar ── */

const BarTrack = styled.div<{ $thin?: boolean }>`
  height: ${(props) => (props.$thin ? "4px" : "6px")};
  background: ${s("backgroundTertiary")};
  border-radius: 4px;
  overflow: hidden;
`;

const BarFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%;
  width: ${(props) => props.$pct}%;
  border-radius: 4px;
  background: ${(props) => props.$color};
  transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);
`;

/* ── Status breakdown ── */

const StatusList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => props.$color};
  flex-shrink: 0;
`;

const StatusName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${s("text")};
  text-transform: capitalize;
  flex: 1;
`;

const StatusMeta = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${s("text")};
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const StatusPct = styled.span`
  font-size: 11px;
  font-weight: 400;
  color: ${s("textTertiary")};
`;

/* ── Care domains ── */

const DomainList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DomainItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DomainRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DomainDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 3px;
  background: ${(props) => props.$color};
  flex-shrink: 0;
`;

const DomainName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${s("text")};
  flex: 1;
`;

const DomainCount = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${s("text")};
  font-variant-numeric: tabular-nums;
`;

/* ── Section completion ── */

const CompletionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CompletionItem = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 120ms ease;

  &:hover {
    background: ${s("backgroundSecondary")};
  }
`;

const CompletionTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const CompletionName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${s("text")};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
`;

const CompletionValues = styled.span`
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-shrink: 0;
`;

const CompletionPct = styled.span<{ $pct: number }>`
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${(props) =>
    props.$pct >= 80
      ? "#16a34a"
      : props.$pct >= 40
        ? "#d97706"
        : "#e63950"};
`;

const CompletionFraction = styled.span`
  font-size: 11px;
  color: ${s("textTertiary")};
`;

/* ── Evidence coverage ── */

const EvidenceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const EvidenceItem = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 120ms ease;

  &:hover {
    background: ${s("backgroundSecondary")};
  }
`;

const EvidenceTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const EvidenceName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${s("text")};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
`;

const EvidenceCount = styled.span`
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${s("text")};
  flex-shrink: 0;
`;

const Empty = styled.div`
  font-size: 13px;
  color: ${s("textTertiary")};
  padding: 8px 0;
`;

export default Analytics;
