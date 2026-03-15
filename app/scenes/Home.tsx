import { observer } from "mobx-react";
import { HomeIcon } from "outline-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";
import { s } from "@shared/styles";
import Flex from "~/components/Flex";
import Notice from "~/components/Notice";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Scene from "~/components/Scene";
import useCurrentUser from "~/hooks/useCurrentUser";
import { client } from "~/utils/ApiClient";
import { conditionPath, conditionsPath } from "~/utils/routeHelpers";

interface HomeDashboardData {
  totals: {
    conditions: number;
    interventions: number;
    scriptures: number;
    recipes: number;
  };
  recentConditions: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: string;
  }>;
}

const STAT_CONFIG = [
  { key: "conditions", color: "#e63950", bg: "#fef2f2" },
  { key: "interventions", color: "#486581", bg: "#f0f4f8" },
  { key: "scriptures", color: "#7c3aed", bg: "#f5f3ff" },
  { key: "recipes", color: "#059669", bg: "#ecfdf5" },
] as const;

const ConditionsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
    <path d="M12 5.36L8.87 8.5a2.13 2.13 0 0 0 0 3h0a2.13 2.13 0 0 0 3 0l2.26-2.21" />
  </svg>
);

const InterventionsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ScripturesIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const RecipesIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z" />
    <line x1="6" y1="17" x2="18" y2="17" />
  </svg>
);

const STAT_ICONS: Record<string, React.ReactNode> = {
  conditions: <ConditionsIcon />,
  interventions: <InterventionsIcon />,
  scriptures: <ScripturesIcon />,
  recipes: <RecipesIcon />,
};

/**
 * Greeting based on time of day.
 *
 * @param t - translation function
 * @returns greeting string
 */
function getGreeting(t: (key: string) => string) {
  const hour = new Date().getHours();
  if (hour < 12) {
    return t("Welcome back");
  }
  if (hour < 18) {
    return t("Welcome back");
  }
  return t("Welcome back");
}

function Home() {
  const user = useCurrentUser();
  const { t } = useTranslation();
  const history = useHistory();
  const [data, setData] = useState<HomeDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const greeting = useMemo(() => getGreeting(t), [t]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await client.post("/home.dashboard");
        setData(res.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("Failed to load dashboard.")
        );
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [t]);

  if (isLoading) {
    return (
      <Scene icon={<HomeIcon />} title={t("Home")}>
        <PlaceholderDocument />
      </Scene>
    );
  }

  if (error || !data) {
    return (
      <Scene icon={<HomeIcon />} title={t("Home")}>
        <Notice>{error ?? t("Failed to load dashboard.")}</Notice>
      </Scene>
    );
  }

  return (
    <Scene icon={<HomeIcon />} title={t("Home")}>
      <WelcomeBanner>
        <WelcomeText>{greeting}</WelcomeText>
        <WelcomeSubtext>{t("Overview")}</WelcomeSubtext>
      </WelcomeBanner>

      <StatsGrid>
        {STAT_CONFIG.map((stat) => (
          <StatCard key={stat.key}>
            <StatInfo>
              <StatLabel>
                {t(stat.key.charAt(0).toUpperCase() + stat.key.slice(1))}
              </StatLabel>
              <StatValue>
                {data.totals[stat.key as keyof typeof data.totals]}
              </StatValue>
            </StatInfo>
            <StatIconWrap $color={stat.color} $bg={stat.bg}>
              {STAT_ICONS[stat.key]}
            </StatIconWrap>
          </StatCard>
        ))}
      </StatsGrid>

      <SectionHeader>
        <SectionTitle>{t("Recent Activity")}</SectionTitle>
        <ViewAllLink onClick={() => history.push(conditionsPath())}>
          {t("View All")} &rarr;
        </ViewAllLink>
      </SectionHeader>

      <ActivityList>
        {data.recentConditions.map((condition) => (
          <ActivityCard
            key={condition.id}
            onClick={() => history.push(conditionPath(condition.id))}
          >
            <ActivityIconWrap>
              <ConditionsIcon />
            </ActivityIconWrap>
            <ActivityContent>
              <ActivityName>{condition.name}</ActivityName>
              <ActivityStatus $status={condition.status}>
                {condition.status}
              </ActivityStatus>
              {condition.description && (
                <ActivityDescription>
                  {condition.description}
                </ActivityDescription>
              )}
            </ActivityContent>
            <ActivityArrow>
              <InterventionsIcon />
            </ActivityArrow>
          </ActivityCard>
        ))}
        {data.recentConditions.length === 0 && (
          <EmptyHint>
            {t("No conditions created yet. Create your first condition to get started.")}
          </EmptyHint>
        )}
      </ActivityList>
    </Scene>
  );
}

const WelcomeBanner = styled.div`
  background: linear-gradient(135deg, #e63950 0%, #b71530 100%);
  border-radius: 12px;
  padding: 28px 32px;
  margin-bottom: 24px;
`;

const WelcomeText = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;

  ${breakpoint("tablet")`
    font-size: 32px;
  `};
`;

const WelcomeSubtext = styled.p`
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 32px;

  ${breakpoint("tablet")`
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  `};
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${s("inputBorder")};
  background: ${s("background")};
  transition: border-color 100ms ease, box-shadow 100ms ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const StatInfo = styled.div`
  min-width: 0;
`;

const StatLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${s("textTertiary")};
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${s("text")};
  line-height: 1.2;
`;

const StatIconWrap = styled.div<{ $color: string; $bg: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${(props) => props.$bg};
  color: ${(props) => props.$color};
  flex-shrink: 0;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${s("text")};
  margin: 0;
`;

const ViewAllLink = styled.button`
  background: none;
  border: none;
  color: ${s("accent")};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActivityCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${s("inputBorder")};
  background: ${s("background")};
  cursor: pointer;
  transition: border-color 100ms ease, box-shadow 100ms ease;

  &:hover {
    border-color: ${s("accent")};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const ActivityIconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #fef2f2;
  color: #e63950;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${s("text")};
  margin-bottom: 2px;
`;

const ActivityStatus = styled.span<{ $status: string }>`
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  color: ${s("textTertiary")};
  text-transform: capitalize;
  margin-bottom: 8px;
`;

const ActivityDescription = styled.p`
  font-size: 14px;
  color: ${s("textSecondary")};
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ActivityArrow = styled.div`
  display: flex;
  align-items: center;
  color: ${s("textTertiary")};
  flex-shrink: 0;
  margin-top: 4px;
`;

const EmptyHint = styled.div`
  font-size: 14px;
  color: ${s("textTertiary")};
  font-style: italic;
  padding: 32px 0;
  text-align: center;
`;

export default observer(Home);
