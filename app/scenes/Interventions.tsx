import { observer } from "mobx-react";
import { ToolsIcon, PlusIcon } from "outline-icons";
import { useEffect, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Action } from "~/components/Actions";
import Button from "~/components/Button";
import Empty from "~/components/Empty";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import Scene from "~/components/Scene";
import Subheading from "~/components/Subheading";
import Text from "~/components/Text";
import useStores from "~/hooks/useStores";
import styled from "styled-components";
import { s } from "@shared/styles";

function Interventions() {
  const { t } = useTranslation();
  const { interventions, careDomains } = useStores();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  useEffect(() => {
    void interventions.fetchPage();
    void careDomains.fetchPage();
  }, [interventions, careDomains]);

  const handleCreate = useCallback(async () => {
    const name = window.prompt(t("Enter the intervention name:"));
    if (!name?.trim()) {
      return;
    }
    await interventions.create({
      name: name.trim(),
    });
  }, [interventions, t]);

  const filtered = selectedDomain
    ? interventions.byCareDomain(selectedDomain)
    : interventions.orderedData;

  return (
    <Scene
      icon={<ToolsIcon />}
      title={t("Interventions")}
      actions={
        <Action>
          <Button icon={<PlusIcon />} onClick={handleCreate}>
            {t("New intervention")}
          </Button>
        </Action>
      }
    >
      <Heading>{t("Interventions")}</Heading>
      <Text as="p" size="large">
        {t(
          "Browse and manage therapeutic interventions organized by NEWSTART+ care domains."
        )}
      </Text>

      <Subheading sticky>
        {t("Care Domains")}
      </Subheading>
      <DomainFilters>
        <FilterChip
          $active={!selectedDomain}
          onClick={() => setSelectedDomain(null)}
        >
          {t("All")}
        </FilterChip>
        {careDomains.orderedData.map((domain) => (
          <FilterChip
            key={domain.id}
            $active={selectedDomain === domain.id}
            $color={domain.color ?? undefined}
            onClick={() =>
              setSelectedDomain(
                selectedDomain === domain.id ? null : domain.id
              )
            }
          >
            {domain.name}
          </FilterChip>
        ))}
      </DomainFilters>

      <Subheading sticky>{t("All Interventions")}</Subheading>

      {filtered.length === 0 && interventions.isLoaded ? (
        <Empty>{t("No interventions found.")}</Empty>
      ) : (
        <InterventionList>
          {filtered.map((intervention) => (
            <InterventionRow key={intervention.id}>
              <Flex align="center" gap={12}>
                <InterventionName>{intervention.name}</InterventionName>
                {intervention.category && (
                  <CategoryTag>{intervention.category}</CategoryTag>
                )}
              </Flex>
              {intervention.description && (
                <Description>{intervention.description}</Description>
              )}
            </InterventionRow>
          ))}
        </InterventionList>
      )}
    </Scene>
  );
}

const DomainFilters = styled(Flex)`
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const FilterChip = styled.button<{ $active: boolean; $color?: string }>`
  border: 1px solid ${(props) => (props.$active ? props.$color ?? props.theme.accent : props.theme.divider)};
  background: ${(props) => (props.$active ? (props.$color ?? props.theme.accent) + "15" : "transparent")};
  color: ${(props) => (props.$active ? props.$color ?? props.theme.accent : props.theme.textSecondary)};
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    border-color: ${(props) => props.$color ?? props.theme.accent};
  }
`;

const InterventionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const InterventionRow = styled.div`
  padding: 12px 16px;
  border-radius: 6px;
  transition: background 100ms ease;

  &:hover {
    background: ${s("backgroundSecondary")};
  }
`;

const InterventionName = styled.span`
  font-weight: 600;
  color: ${s("text")};
`;

const CategoryTag = styled.span`
  font-size: 11px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  background: ${s("backgroundSecondary")};
  color: ${s("textTertiary")};
`;

const Description = styled.div`
  font-size: 13px;
  color: ${s("textSecondary")};
  margin-top: 4px;
`;

export default observer(Interventions);
