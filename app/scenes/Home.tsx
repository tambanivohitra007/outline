import { observer } from "mobx-react";
import {
  HomeIcon,
  CollectionIcon,
  DocumentIcon,
  StarredIcon,
  ClockIcon,
} from "outline-icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Switch, Route } from "react-router-dom";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";
import { s } from "@shared/styles";
import { Action } from "~/components/Actions";
import Empty from "~/components/Empty";
import Flex from "~/components/Flex";
import InputSearchPage from "~/components/InputSearchPage";
import LanguagePrompt from "~/components/LanguagePrompt";
import PaginatedDocumentList from "~/components/PaginatedDocumentList";
import PinnedDocuments from "~/components/PinnedDocuments";
import { ResizingHeightContainer } from "~/components/ResizingHeightContainer";
import Scene from "~/components/Scene";
import Tab from "~/components/Tab";
import Tabs from "~/components/Tabs";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import useCurrentUser from "~/hooks/useCurrentUser";
import { usePinnedDocuments } from "~/hooks/usePinnedDocuments";
import usePolicy from "~/hooks/usePolicy";
import useStores from "~/hooks/useStores";
import NewDocumentMenu from "~/menus/NewDocumentMenu";

/**
 * Greeting based on time of day.
 *
 * @param name - user's display name
 * @param t - translation function
 * @returns greeting string
 */
function getGreeting(name: string, t: (key: string, opts?: Record<string, unknown>) => string) {
  const hour = new Date().getHours();
  if (hour < 12) {
    return t("Good morning, {{ name }}", { name });
  }
  if (hour < 18) {
    return t("Good afternoon, {{ name }}", { name });
  }
  return t("Good evening, {{ name }}", { name });
}

function Home() {
  const { documents, collections, stars, ui } = useStores();
  const team = useCurrentTeam();
  const user = useCurrentUser();
  const { t } = useTranslation();
  const userId = user?.id;
  const { pins, count } = usePinnedDocuments("home");
  const can = usePolicy(team);

  const greeting = useMemo(
    () => getGreeting(user.name, t),
    [user.name, t]
  );

  const stats = useMemo(
    () => [
      {
        icon: <DocumentIcon />,
        label: t("Documents"),
        value: documents.all.length,
      },
      {
        icon: <CollectionIcon />,
        label: t("Collections"),
        value: collections.orderedData.length,
      },
      {
        icon: <StarredIcon />,
        label: t("Starred"),
        value: stars.orderedData.length,
      },
      {
        icon: <ClockIcon />,
        label: t("Recently viewed"),
        value: documents.recentlyViewed.length,
      },
    ],
    [
      documents.all.length,
      collections.orderedData.length,
      stars.orderedData.length,
      documents.recentlyViewed.length,
      t,
    ]
  );

  return (
    <Scene
      icon={<HomeIcon />}
      title={t("Home")}
      left={
        <InputSearchPage source="dashboard" label={t("Search documents")} />
      }
      actions={
        <Action>
          <NewDocumentMenu />
        </Action>
      }
    >
      <ResizingHeightContainer>
        {!ui.languagePromptDismissed && <LanguagePrompt key="language" />}
      </ResizingHeightContainer>

      <WelcomeBanner>
        <Greeting>{greeting}</Greeting>
        <Subtitle>
          {t("Here\u2019s what\u2019s happening in your knowledge base")}
        </Subtitle>
      </WelcomeBanner>

      <StatsGrid>
        {stats.map((stat) => (
          <StatCard key={stat.label}>
            <StatIcon>{stat.icon}</StatIcon>
            <StatInfo>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatInfo>
          </StatCard>
        ))}
      </StatsGrid>

      <PinnedDocuments
        pins={pins}
        canUpdate={can.update}
        placeholderCount={count}
      />
      <Documents>
        <Tabs>
          <Tab to="/home" exact>
            {t("Recently viewed")}
          </Tab>
          <Tab to="/home/popular" exact>
            {t("Popular")}
          </Tab>
          <Tab to="/home/recent" exact>
            {t("Recently updated")}
          </Tab>
          <Tab to="/home/created">{t("Created by me")}</Tab>
        </Tabs>
        <Switch>
          <Route path="/home/recent">
            <PaginatedDocumentList
              documents={documents.recentlyUpdated}
              fetch={documents.fetchRecentlyUpdated}
              empty={<Empty>{t("Weird, this shouldn't ever be empty")}</Empty>}
              showCollection
            />
          </Route>
          <Route path="/home/popular">
            <PaginatedDocumentList
              key="popular"
              documents={documents.popular}
              fetch={documents.fetchPopular}
              empty={
                <Empty>
                  {t("Documents with recent activity will appear here")}
                </Empty>
              }
              showCollection
            />
          </Route>
          <Route path="/home/created">
            <PaginatedDocumentList
              key="created"
              documents={documents.createdByUser(userId)}
              fetch={documents.fetchOwned}
              options={{
                userId,
              }}
              empty={
                <Empty>{t("You haven't created any documents yet")}</Empty>
              }
              showCollection
            />
          </Route>
          <Route path="/home">
            <PaginatedDocumentList
              key="recent"
              documents={documents.recentlyViewed}
              fetch={documents.fetchRecentlyViewed}
              empty={
                <Empty>
                  {t(
                    "Documents you've recently viewed will be here for easy access"
                  )}
                </Empty>
              }
              showCollection
            />
          </Route>
        </Switch>
      </Documents>
    </Scene>
  );
}

const WelcomeBanner = styled.div`
  margin-bottom: 24px;
`;

const Greeting = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${s("text")};
  margin: 0 0 4px;

  ${breakpoint("tablet")`
    font-size: 32px;
  `};
`;

const Subtitle = styled.p`
  font-size: 15px;
  color: ${s("textTertiary")};
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 28px;

  ${breakpoint("tablet")`
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  `};
`;

const StatCard = styled(Flex).attrs({ align: "center" })`
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid ${s("inputBorder")};
  background: ${s("background")};
  transition: border-color 100ms ease, box-shadow 100ms ease;

  &:hover {
    border-color: ${s("accent")};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
`;

const StatIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${s("accent")};
  color: white;
  flex-shrink: 0;

  svg {
    fill: white;
    width: 20px;
    height: 20px;
  }
`;

const StatInfo = styled.div`
  min-width: 0;
`;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${s("text")};
  line-height: 1.2;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${s("textTertiary")};
  white-space: nowrap;
`;

const Documents = styled.div`
  position: relative;
  background: ${s("background")};
`;

export default observer(Home);
