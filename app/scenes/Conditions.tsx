import invariant from "invariant";
import { observer } from "mobx-react";
import { BeakerIcon, PlusIcon, TrashIcon, CloseIcon } from "outline-icons";
import { useEffect, useCallback, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { toast } from "sonner";
import { Action } from "~/components/Actions";
import Button from "~/components/Button";
import Empty from "~/components/Empty";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import Input from "~/components/Input";
import Scene from "~/components/Scene";
import Subheading from "~/components/Subheading";
import Text from "~/components/Text";
import AISearchBar from "~/components/medical/AISearchBar";
import useStores from "~/hooks/useStores";
import { conditionPath } from "~/utils/routeHelpers";
import styled from "styled-components";
import { s } from "@shared/styles";

function Conditions() {
  const { t } = useTranslation();
  const { conditions } = useStores();
  const history = useHistory();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSnomed, setCreateSnomed] = useState("");
  const [createIcd, setCreateIcd] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void conditions.fetchPage();
  }, [conditions]);

  const filtered = useMemo(() => {
    let data = conditions.orderedData;
    if (statusFilter) {
      data = data.filter((c) => c.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.snomedCode?.toLowerCase().includes(q) ||
          c.icdCode?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [conditions.orderedData, search, statusFilter]);

  const handleCreate = useCallback(async () => {
    if (!createName.trim()) {
      return;
    }
    setIsCreating(true);
    try {
      const res = await conditions.create({
        name: createName.trim(),
        snomedCode: createSnomed.trim() || undefined,
        icdCode: createIcd.trim() || undefined,
        status: "draft",
      });
      invariant(res, "Condition should be created");
      setCreateName("");
      setCreateSnomed("");
      setCreateIcd("");
      setShowCreateForm(false);
      history.push(conditionPath(res.id));
    } finally {
      setIsCreating(false);
    }
  }, [conditions, history, createName, createSnomed, createIcd]);

  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setCreateName("");
    setCreateSnomed("");
    setCreateIcd("");
  }, []);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, condition: { id: string; name: string }) => {
      e.stopPropagation();
      const confirmed = window.confirm(
        t(
          `Are you sure you want to delete "{{ conditionName }}"? This will also remove all backing documents and sections.`,
          { conditionName: condition.name }
        )
      );
      if (!confirmed) {
        return;
      }
      await conditions.delete(condition as any);
      toast.success(t("Condition deleted"));
    },
    [conditions, t]
  );

  return (
    <Scene
      icon={<BeakerIcon />}
      title={t("Conditions")}
      actions={
        <Action>
          <Button
            icon={<PlusIcon />}
            onClick={() => setShowCreateForm(true)}
          >
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

      <AISearchBar />

      {showCreateForm && (
        <CreateFormCard>
          <CreateFormHeader>
            <CreateFormTitle>{t("New Condition")}</CreateFormTitle>
            <CloseButton onClick={handleCancelCreate}>
              <CloseIcon size={16} />
            </CloseButton>
          </CreateFormHeader>
          <CreateFormFields>
            <FormGroup>
              <FormLabel>{t("Condition Name")} *</FormLabel>
              <FormInput
                placeholder={t("e.g. Type 2 Diabetes Mellitus")}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                autoFocus
              />
            </FormGroup>
            <FormRow>
              <FormGroup>
                <FormLabel>{t("SNOMED CT Code")}</FormLabel>
                <FormInput
                  placeholder={t("e.g. 44054006")}
                  value={createSnomed}
                  onChange={(e) => setCreateSnomed(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("ICD Code")}</FormLabel>
                <FormInput
                  placeholder={t("e.g. E11")}
                  value={createIcd}
                  onChange={(e) => setCreateIcd(e.target.value)}
                />
              </FormGroup>
            </FormRow>
            <FormActions>
              <CreateButton
                onClick={handleCreate}
                disabled={!createName.trim() || isCreating}
              >
                {isCreating ? `${t("Creating")}\u2026` : t("Create Condition")}
              </CreateButton>
              <CancelButton onClick={handleCancelCreate}>
                {t("Cancel")}
              </CancelButton>
            </FormActions>
          </CreateFormFields>
        </CreateFormCard>
      )}

      <FilterRow>
        <SearchInput
          placeholder={t("Search conditions\u2026")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <StatusFilters>
          <FilterChip
            $active={!statusFilter}
            onClick={() => setStatusFilter(null)}
          >
            {t("All")}
          </FilterChip>
          <FilterChip
            $active={statusFilter === "draft"}
            onClick={() => setStatusFilter(statusFilter === "draft" ? null : "draft")}
          >
            {t("Draft")}
          </FilterChip>
          <FilterChip
            $active={statusFilter === "review"}
            onClick={() => setStatusFilter(statusFilter === "review" ? null : "review")}
          >
            {t("Review")}
          </FilterChip>
          <FilterChip
            $active={statusFilter === "published"}
            onClick={() => setStatusFilter(statusFilter === "published" ? null : "published")}
          >
            {t("Published")}
          </FilterChip>
        </StatusFilters>
      </FilterRow>

      <Subheading sticky>
        {statusFilter
          ? t("{{status}} Conditions", { status: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) })
          : t("All Conditions")} ({filtered.length})
      </Subheading>

      {filtered.length === 0 && conditions.isLoaded ? (
        <Empty>
          {search.trim()
            ? t("No conditions matching your search.")
            : t("No conditions have been created yet.")}
        </Empty>
      ) : (
        <ConditionGrid>
          {filtered.map((condition) => (
            <ConditionCard
              key={condition.id}
              onClick={() => history.push(conditionPath(condition.id))}
            >
              <CardHeader>
                <CardTitle>{condition.name}</CardTitle>
                <CardActions>
                  <StatusBadge $status={condition.status}>
                    {condition.status}
                  </StatusBadge>
                  <DeleteButton
                    onClick={(e) => handleDelete(e, condition)}
                    title={t("Delete condition")}
                  >
                    <TrashIcon size={16} />
                  </DeleteButton>
                </CardActions>
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

const FilterRow = styled(Flex)`
  gap: 16px;
  align-items: center;
  margin: 16px 0;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
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

const StatusFilters = styled(Flex)`
  gap: 6px;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  border: 1px solid ${(props) => (props.$active ? props.theme.accent : props.theme.divider)};
  background: ${(props) => (props.$active ? props.theme.accent + "15" : "transparent")};
  color: ${(props) => (props.$active ? props.theme.accent : props.theme.textSecondary)};
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    border-color: ${(props) => props.theme.accent};
  }
`;

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

const CardActions = styled(Flex)`
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: none;
  border-radius: 4px;
  color: ${s("textTertiary")};
  cursor: pointer;
  opacity: 0;
  transition: opacity 100ms ease, color 100ms ease;

  ${ConditionCard}:hover & {
    opacity: 1;
  }

  &:hover {
    color: ${(props) => props.theme.danger};
    background: ${(props) => props.theme.danger}10;
  }
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
