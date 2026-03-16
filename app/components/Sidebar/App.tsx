import { observer } from "mobx-react";
import { SearchIcon, HomeIcon, SidebarIcon, BeakerIcon, ToolsIcon, LeafIcon, BookmarkedIcon, GlobeIcon, SettingsIcon } from "outline-icons";
import { useEffect, useState, useCallback, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { s } from "@shared/styles";
import { metaDisplay } from "@shared/utils/keyboard";
import Scrollable from "~/components/Scrollable";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import useCurrentUser from "~/hooks/useCurrentUser";
import usePolicy from "~/hooks/usePolicy";
import useStores from "~/hooks/useStores";
import {
  homePath,
  searchPath,
  conditionsPath,
  interventionsPath,
  recipesPath,
  bibleExplorerPath,
  knowledgeGraphPath,
  analyticsPath,
} from "~/utils/routeHelpers";
import Tooltip from "../Tooltip";
import Sidebar from "./Sidebar";
import Collections from "./components/Collections";
import { DraftsLink } from "./components/DraftsLink";
import DragPlaceholder from "./components/DragPlaceholder";
import HistoryNavigation from "./components/HistoryNavigation";
import Header from "./components/Header";
import Section from "./components/Section";
import SidebarLink from "./components/SidebarLink";
import SharedWithMe from "./components/SharedWithMe";
import Starred from "./components/Starred";
import ToggleButton from "./components/ToggleButton";

function AppSidebar() {
  const { t } = useTranslation();
  const { documents, ui, collections, conditions } = useStores();
  const team = useCurrentTeam();
  const user = useCurrentUser();
  const can = usePolicy(team);

  useEffect(() => {
    void collections.fetchAll();
    void conditions.fetchAll();

    if (!user.isViewer) {
      void documents.fetchDrafts();
    }
  }, [documents, collections, conditions, user.isViewer]);

  const [dndArea, setDndArea] = useState();
  const handleSidebarRef = useCallback((node) => setDndArea(node), []);
  const html5Options = useMemo(
    () => ({
      rootElement: dndArea,
    }),
    [dndArea]
  );

  return (
    <Sidebar hidden={!ui.readyToShow} ref={handleSidebarRef}>
      <HistoryNavigation />
      {dndArea && (
        <DndProvider backend={HTML5Backend} options={html5Options}>
          <DragPlaceholder />

          <LogoSection>
            <Logo src="/images/lifestyle-logo.png" alt={t("Family & Lifestyle Medicine")} />
            <ToggleButtonWrapper>
              <Tooltip
                content={t("Toggle sidebar")}
                shortcut={`${metaDisplay}+.`}
              >
                <ToggleButton
                  position="bottom"
                  image={<SidebarIcon />}
                  aria-label={
                    ui.sidebarCollapsed
                      ? t("Expand sidebar")
                      : t("Collapse sidebar")
                  }
                  onClick={() => {
                    ui.toggleCollapsedSidebar();
                    (document.activeElement as HTMLElement)?.blur();
                  }}
                />
              </Tooltip>
            </ToggleButtonWrapper>
          </LogoSection>
          <Scrollable flex shadow>
            <Section>
              <SidebarLink
                to={homePath()}
                icon={<HomeIcon />}
                exact={false}
                label={t("Home")}
              />
              <SidebarLink
                to={searchPath()}
                icon={<SearchIcon />}
                label={t("Search")}
                exact={false}
              />
              {can.createDocument && <DraftsLink />}
            </Section>
            <Separator />
            <Section>
              <Header id="clinical" title={t("Clinical")}>
                <SidebarLink
                  to={conditionsPath()}
                  icon={<BeakerIcon />}
                  label={t("Conditions")}
                  exact={false}
                />
                <SidebarLink
                  to={interventionsPath()}
                  icon={<ToolsIcon />}
                  label={t("Interventions")}
                  exact={false}
                />
                <SidebarLink
                  to={recipesPath()}
                  icon={<LeafIcon />}
                  label={t("Recipes")}
                  exact={false}
                />
                <SidebarLink
                  to={bibleExplorerPath()}
                  icon={<BookmarkedIcon />}
                  label={t("Bible Explorer")}
                  exact={false}
                />
              </Header>
            </Section>
            <Separator />
            <Section>
              <Header id="insights" title={t("Insights")}>
                <SidebarLink
                  to={knowledgeGraphPath()}
                  icon={<GlobeIcon />}
                  label={t("Knowledge Graph")}
                  exact={false}
                />
                <SidebarLink
                  to={analyticsPath()}
                  icon={<SettingsIcon />}
                  label={t("Analytics")}
                  exact={false}
                />
              </Header>
            </Section>
            <Separator />
            <Section>
              <Starred />
            </Section>
            <Section>
              <SharedWithMe />
            </Section>
            <Section>
              <Collections />
            </Section>
          </Scrollable>
        </DndProvider>
      )}
    </Sidebar>
  );
}

const LogoSection = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px 12px;
  flex-shrink: 0;
`;

const ToggleButtonWrapper = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
`;

const Logo = styled.img`
  height: 100px;
  width: auto;
  object-fit: contain;
`;

const Separator = styled.div`
  border-top: 1px solid ${s("sidebarControlHoverBackground")};
  margin: 4px 20px;
`;

export default observer(AppSidebar);
