import { observer } from "mobx-react";
import { BeakerIcon } from "outline-icons";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { RouteComponentProps } from "react-router-dom";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Scene from "~/components/Scene";
import useStores from "~/hooks/useStores";
import ConditionHeader from "./components/ConditionHeader";
import SectionPanel from "./components/SectionPanel";
import MetadataPanel from "./components/MetadataPanel";
import styled from "styled-components";
import { s } from "@shared/styles";

type Params = {
  id: string;
};

type Props = RouteComponentProps<Params>;

function ConditionEditor({ match }: Props) {
  const { t } = useTranslation();
  const { conditions, conditionSections } = useStores();
  const { id } = match.params;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        await conditions.fetch(id);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [conditions, id]);

  const condition = conditions.get(id);

  // Fetch sections once condition is loaded
  useEffect(() => {
    if (condition) {
      void conditionSections.fetchPage({ conditionId: condition.id });
    }
  }, [condition, conditionSections]);

  if (isLoading || !condition) {
    return (
      <Scene icon={<BeakerIcon />} title={t("Loading...")}>
        <PlaceholderDocument />
      </Scene>
    );
  }

  const sections = conditionSections.forCondition(condition.id);

  return (
    <Scene
      icon={<BeakerIcon />}
      title={condition.name}
      wide
    >
      <ConditionHeader condition={condition} />

      <EditorLayout>
        <MainContent>
          {sections.length === 0 ? (
            <EmptyState>
              {t("No sections found. Sections are created automatically when a condition is created via the API.")}
            </EmptyState>
          ) : (
            sections.map((section) => (
              <SectionPanel key={section.id} section={section} />
            ))
          )}
        </MainContent>

        <SidePanel>
          <MetadataPanel condition={condition} />
        </SidePanel>
      </EditorLayout>
    </Scene>
  );
}

const EditorLayout = styled(Flex)`
  gap: 24px;
  align-items: flex-start;
  margin-top: 16px;

  @media (max-width: 960px) {
    flex-direction: column;
  }
`;

const MainContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SidePanel = styled.div`
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;

  @media (max-width: 960px) {
    width: 100%;
    position: static;
  }
`;

const EmptyState = styled.div`
  padding: 40px;
  text-align: center;
  color: ${s("textTertiary")};
  font-size: 14px;
`;

export default observer(ConditionEditor);
