import invariant from "invariant";
import { observer } from "mobx-react";
import { BeakerIcon, PlusIcon } from "outline-icons";
import { useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Action } from "~/components/Actions";
import Button from "~/components/Button";
import Empty from "~/components/Empty";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import Scene from "~/components/Scene";
import Subheading from "~/components/Subheading";
import Text from "~/components/Text";
import useStores from "~/hooks/useStores";
import { conditionPath } from "~/utils/routeHelpers";
import styled from "styled-components";
import { s } from "@shared/styles";

function Conditions() {
  const { t } = useTranslation();
  const { conditions } = useStores();
  const history = useHistory();

  useEffect(() => {
    void conditions.fetchPage();
  }, [conditions]);

  const handleCreate = useCallback(async () => {
    const name = window.prompt(t("Enter the condition name:"));
    if (!name?.trim()) {
      return;
    }
    const res = await conditions.create({
      name: name.trim(),
      status: "draft",
    });
    invariant(res, "Condition should be created");
    history.push(conditionPath(res.id));
  }, [conditions, history, t]);

  return (
    <Scene
      icon={<BeakerIcon />}
      title={t("Conditions")}
      actions={
        <Action>
          <Button icon={<PlusIcon />} onClick={handleCreate}>
            {t("New condition")}
          </Button>
        </Action>
      }
    >
      <Heading>{t("Medical Conditions")}</Heading>
      <Text as="p" size="large">
        {t(
          "Manage condition treatment guides with structured sections for risk factors, physiology, complications, and interventions."
        )}
      </Text>

      <Subheading sticky>{t("All Conditions")}</Subheading>

      {conditions.orderedData.length === 0 && conditions.isLoaded ? (
        <Empty>{t("No conditions have been created yet.")}</Empty>
      ) : (
        <ConditionGrid>
          {conditions.orderedData.map((condition) => (
            <ConditionCard
              key={condition.id}
              onClick={() => history.push(conditionPath(condition.id))}
            >
              <CardHeader>
                <CardTitle>{condition.name}</CardTitle>
                <StatusBadge $status={condition.status}>
                  {condition.status}
                </StatusBadge>
              </CardHeader>
              {condition.snomedCode && (
                <CardMeta>{t("SNOMED")}: {condition.snomedCode}</CardMeta>
              )}
              {condition.icdCode && (
                <CardMeta>{t("ICD")}: {condition.icdCode}</CardMeta>
              )}
            </ConditionCard>
          ))}
        </ConditionGrid>
      )}
    </Scene>
  );
}

const ConditionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 8px;
`;

const ConditionCard = styled.div`
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 100ms ease-in-out;

  &:hover {
    border-color: ${s("accent")};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const CardHeader = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${s("text")};
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 10px;
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

const CardMeta = styled.div`
  font-size: 13px;
  color: ${s("textTertiary")};
`;

export default observer(Conditions);
