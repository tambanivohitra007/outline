import { observer } from "mobx-react";
import { SearchIcon, HomeIcon, SidebarIcon, BeakerIcon, ToolsIcon, LeafIcon, GlobeIcon, SettingsIcon } from "outline-icons";
import { useEffect, useState, useCallback, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { metaDisplay } from "@shared/utils/keyboard";
import Scrollable from "~/components/Scrollable";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import useCurrentUser from "~/hooks/useCurrentUser";
import usePolicy from "~/hooks/usePolicy";
import useStores from "~/hooks/useStores";
import TeamMenu from "~/menus/TeamMenu";
import {
  homePath,
  searchPath,
  conditionsPath,
  interventionsPath,
  recipesPath,
  knowledgeGraphPath,
  analyticsPath,
} from "~/utils/routeHelpers";
import TeamLogo from "../TeamLogo";
import Tooltip from "../Tooltip";
import Sidebar from "./Sidebar";
import Collections from "./components/Collections";
import { DraftsLink } from "./components/DraftsLink";
import DragPlaceholder from "./components/DragPlaceholder";
import HistoryNavigation from "./components/HistoryNavigation";
import Section from "./components/Section";
import SidebarButton from "./components/SidebarButton";
import SidebarLink from "./components/SidebarLink";
import SharedWithMe from "./components/SharedWithMe";
import Starred from "./components/Starred";
import ToggleButton from "./components/ToggleButton";

function AppSidebar() {
  const { t } = useTranslation();
  const { documents, ui, collections } = useStores();
  const team = useCurrentTeam();
  const user = useCurrentUser();
  const can = usePolicy(team);

  useEffect(() => {
    void collections.fetchAll();

    if (!user.isViewer) {
      void documents.fetchDrafts();
    }
  }, [documents, collections, user.isViewer]);

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

          <TeamMenu>
            <SidebarButton
              title={team.name}
              image={
                <TeamLogo
                  model={team}
                  size={24}
                  alt={t("Logo")}
                  style={{ marginLeft: 4 }}
                />
              }
            >
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
            </SidebarButton>
          </TeamMenu>
          <Overflow>
            <Section>
              <SidebarLink
                to={homePath()}
                icon={<HomeIcon />}
                exact={false}
                label={t("Home")}
                description={t("Recent activity & updates")}
              />
              <SidebarLink
                to={searchPath()}
                icon={<SearchIcon />}
                label={t("Search")}
                description={t("Find documents & knowledge")}
                exact={false}
              />
              {can.createDocument && <DraftsLink />}
            </Section>
          </Overflow>
          <Scrollable flex shadow>
            <Section>
              <SidebarLink
                to={conditionsPath()}
                icon={<BeakerIcon />}
                label={t("Conditions")}
                description={t("Browse medical conditions & diagnoses")}
                exact={false}
              />
              <SidebarLink
                to={interventionsPath()}
                icon={<ToolsIcon />}
                label={t("Interventions")}
                description={t("Treatment plans & therapeutic protocols")}
                exact={false}
              />
              <SidebarLink
                to={recipesPath()}
                icon={<LeafIcon />}
                label={t("Recipes")}
                description={t("Healthy recipes & nutritional guides")}
                exact={false}
              />
              <SidebarLink
                to={knowledgeGraphPath()}
                icon={<GlobeIcon />}
                label={t("Knowledge Graph")}
                description={t("Explore relationships between concepts")}
                exact={false}
              />
              <SidebarLink
                to={analyticsPath()}
                icon={<SettingsIcon />}
                label={t("Analytics")}
                description={t("Insights, metrics & reporting")}
                exact={false}
              />
            </Section>
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

const Overflow = styled.div`
  overflow: hidden;
  flex-shrink: 0;
`;

export default observer(AppSidebar);
