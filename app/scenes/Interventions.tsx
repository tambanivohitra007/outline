import { observer } from "mobx-react";
import { ToolsIcon, PlusIcon, CloseIcon } from "outline-icons";
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

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createDomainId, setCreateDomainId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void interventions.fetchPage();
    void careDomains.fetchPage();
  }, [interventions, careDomains]);

  const handleCreate = useCallback(async () => {
    if (!createName.trim()) {
      return;
    }
    setIsCreating(true);
    try {
      await interventions.create({
        name: createName.trim(),
        category: createCategory.trim() || undefined,
        description: createDescription.trim() || undefined,
        careDomainId: createDomainId || undefined,
      });
      setCreateName("");
      setCreateCategory("");
      setCreateDescription("");
      setCreateDomainId("");
      setShowCreateForm(false);
    } finally {
      setIsCreating(false);
    }
  }, [interventions, createName, createCategory, createDescription, createDomainId]);

  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setCreateName("");
    setCreateCategory("");
    setCreateDescription("");
    setCreateDomainId("");
  }, []);

  const filtered = selectedDomain
    ? interventions.byCareDomain(selectedDomain)
    : interventions.orderedData;

  return (
    <Scene
      icon={<ToolsIcon />}
      title={t("Interventions")}
      actions={
        <Action>
          <Button
            icon={<PlusIcon />}
            onClick={() => setShowCreateForm(true)}
          >
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

      {showCreateForm && (
        <CreateFormCard>
          <CreateFormHeader>
            <CreateFormTitle>{t("New Intervention")}</CreateFormTitle>
            <CloseButton onClick={handleCancelCreate}>
              <CloseIcon size={16} />
            </CloseButton>
          </CreateFormHeader>
          <CreateFormFields>
            <FormGroup>
              <FormLabel>{t("Intervention Name")} *</FormLabel>
              <FormInput
                placeholder={t("e.g. Mediterranean Diet Protocol")}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                autoFocus
              />
            </FormGroup>
            <FormRow>
              <FormGroup>
                <FormLabel>{t("Category")}</FormLabel>
                <FormInput
                  placeholder={t("e.g. Dietary, Exercise, Supplementation")}
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("Care Domain")}</FormLabel>
                <FormSelect
                  value={createDomainId}
                  onChange={(e) => setCreateDomainId(e.target.value)}
                >
                  <option value="">{t("Select a domain\u2026")}</option>
                  {careDomains.orderedData.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>
            </FormRow>
            <FormGroup>
              <FormLabel>{t("Description")}</FormLabel>
              <FormTextarea
                placeholder={t("Brief description of this intervention\u2026")}
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                rows={2}
              />
            </FormGroup>
            <FormActions>
              <CreateButton
                onClick={handleCreate}
                disabled={!createName.trim() || isCreating}
              >
                {isCreating ? `${t("Creating")}\u2026` : t("Create Intervention")}
              </CreateButton>
              <CancelButton onClick={handleCancelCreate}>
                {t("Cancel")}
              </CancelButton>
            </FormActions>
          </CreateFormFields>
        </CreateFormCard>
      )}

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

const CreateFormCard = styled.div`
  border: 1px solid ${s("accent")};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  background: ${s("background")};
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const CreateFormHeader = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CreateFormTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${s("text")};
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: none;
  border-radius: 4px;
  color: ${s("textTertiary")};
  cursor: pointer;

  &:hover {
    color: ${s("text")};
  }
`;

const CreateFormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const FormRow = styled(Flex)`
  gap: 12px;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const FormLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${s("textSecondary")};
`;

const FormInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: ${s("accent")};
  }
`;

const FormSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: ${s("accent")};
  }
`;

const FormTextarea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 14px;
  outline: none;
  resize: vertical;
  font-family: inherit;

  &:focus {
    border-color: ${s("accent")};
  }
`;

const FormActions = styled(Flex)`
  gap: 8px;
  margin-top: 4px;
`;

const CreateButton = styled.button`
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: ${(props) => props.theme.accent};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 100ms ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 8px 20px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: transparent;
  color: ${s("textSecondary")};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    border-color: ${s("text")};
  }
`;

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
