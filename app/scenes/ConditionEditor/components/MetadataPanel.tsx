import { observer } from "mobx-react";
import { PlusIcon, CloseIcon, SearchIcon } from "outline-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Flex from "~/components/Flex";
import type Condition from "~/models/Condition";
import type Intervention from "~/models/Intervention";
import BibleSearch from "~/components/medical/BibleSearch";
import ClinicalTrialSearch from "~/components/medical/ClinicalTrialSearch";
import PubMedSearch from "~/components/medical/PubMedSearch";
import useStores from "~/hooks/useStores";
import { client } from "~/utils/ApiClient";
import styled from "styled-components";
import { s } from "@shared/styles";

interface Props {
  condition: Condition;
}

function MetadataPanel({ condition }: Props) {
  const { t } = useTranslation();
  const {
    conditions,
    conditionInterventions,
    interventions,
    evidenceEntries,
    scriptures,
  } = useStores();

  const [showInterventionSearch, setShowInterventionSearch] = useState(false);
  const [interventionQuery, setInterventionQuery] = useState("");

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [aiSectionType, setAiSectionType] = useState("solutions");
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [showPubMedSearch, setShowPubMedSearch] = useState(false);
  const [showClinicalTrials, setShowClinicalTrials] = useState(false);
  const [showBibleSearch, setShowBibleSearch] = useState(false);

  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceJournal, setEvidenceJournal] = useState("");
  const [evidenceDoi, setEvidenceDoi] = useState("");

  const [showScriptureForm, setShowScriptureForm] = useState(false);
  const [scriptureRef, setScriptureRef] = useState("");
  const [scriptureText, setScriptureText] = useState("");
  const [isSop, setIsSop] = useState(false);
  const [sopSource, setSopSource] = useState("");

  useEffect(() => {
    void conditionInterventions.fetchPage({ conditionId: condition.id });
    void interventions.fetchPage();
    void evidenceEntries.fetchPage({ conditionId: condition.id });
    void scriptures.fetchPage({ conditionId: condition.id });
  }, [condition.id, conditionInterventions, interventions, evidenceEntries, scriptures]);

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    await conditions.update({
      id: condition.id,
      status: e.target.value as "draft" | "review" | "published",
    });
  };

  const handleLinkIntervention = useCallback(
    async (intervention: Intervention) => {
      await conditionInterventions.create({
        conditionId: condition.id,
        interventionId: intervention.id,
      });
      setInterventionQuery("");
      setShowInterventionSearch(false);
      toast.success(t("Intervention linked"));
    },
    [condition.id, conditionInterventions, t]
  );

  const handleUnlinkIntervention = useCallback(
    async (linkId: string) => {
      await conditionInterventions.delete({ id: linkId } as any);
      toast.success(t("Intervention unlinked"));
    },
    [conditionInterventions, t]
  );

  const handleAddEvidence = useCallback(async () => {
    if (!evidenceTitle.trim()) {
      return;
    }
    await evidenceEntries.create({
      title: evidenceTitle.trim(),
      journal: evidenceJournal.trim() || undefined,
      doi: evidenceDoi.trim() || undefined,
      conditionId: condition.id,
    });
    setEvidenceTitle("");
    setEvidenceJournal("");
    setEvidenceDoi("");
    setShowEvidenceForm(false);
    toast.success(t("Evidence entry added"));
  }, [evidenceTitle, evidenceJournal, evidenceDoi, condition.id, evidenceEntries, t]);

  const handleDeleteEvidence = useCallback(
    async (entry: { id: string }) => {
      await evidenceEntries.delete(entry as any);
      toast.success(t("Evidence entry removed"));
    },
    [evidenceEntries, t]
  );

  const handleAddScripture = useCallback(async () => {
    if (!scriptureRef.trim()) {
      return;
    }
    await scriptures.create({
      reference: scriptureRef.trim(),
      text: scriptureText.trim() || undefined,
      spiritOfProphecy: isSop,
      sopSource: isSop && sopSource.trim() ? sopSource.trim() : undefined,
      conditionId: condition.id,
    });
    setScriptureRef("");
    setScriptureText("");
    setIsSop(false);
    setSopSource("");
    setShowScriptureForm(false);
    toast.success(t("Scripture reference added"));
  }, [scriptureRef, scriptureText, isSop, sopSource, condition.id, scriptures, t]);

  const handleDeleteScripture = useCallback(
    async (scripture: { id: string }) => {
      await scriptures.delete(scripture as any);
      toast.success(t("Scripture reference removed"));
    },
    [scriptures, t]
  );

  const handleGetSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    setAiSuggestions(null);
    try {
      const res = await client.post("/ai.suggest", {
        conditionId: condition.id,
        sectionType: aiSectionType,
      });
      setAiSuggestions(res.data?.suggestions ?? "");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("Failed to get suggestions")
      );
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [condition.id, aiSectionType, t]);

  const links = conditionInterventions.forCondition(condition.id);
  const linkedInterventionIds = new Set(links.map((l) => l.interventionId));
  const availableInterventions = interventions.orderedData.filter(
    (i) =>
      !linkedInterventionIds.has(i.id) &&
      (!interventionQuery.trim() ||
        i.name.toLowerCase().includes(interventionQuery.trim().toLowerCase()))
  );

  const evidence = evidenceEntries.forCondition(condition.id);
  const conditionScriptures = scriptures.forCondition(condition.id);

  return (
    <Panel>
      <PanelSection>
        <PanelTitle>{t("Status")}</PanelTitle>
        <StatusSelect
          value={condition.status}
          onChange={handleStatusChange}
        >
          <option value="draft">{t("Draft")}</option>
          <option value="review">{t("In Review")}</option>
          <option value="published">{t("Published")}</option>
        </StatusSelect>
      </PanelSection>

      <PanelSection>
        <PanelTitle>{t("Medical Codes")}</PanelTitle>
        <MetaField>
          <MetaLabel>{t("SNOMED CT")}</MetaLabel>
          <MetaValue>{condition.snomedCode || t("Not set")}</MetaValue>
        </MetaField>
        <MetaField>
          <MetaLabel>{t("ICD Code")}</MetaLabel>
          <MetaValue>{condition.icdCode || t("Not set")}</MetaValue>
        </MetaField>
      </PanelSection>

      <PanelSection>
        <SectionHeader>
          <PanelTitle>
            {t("Interventions")} ({links.length})
          </PanelTitle>
          <AddButton
            onClick={() => setShowInterventionSearch(!showInterventionSearch)}
            title={t("Link intervention")}
          >
            <PlusIcon size={14} />
          </AddButton>
        </SectionHeader>

        {showInterventionSearch && (
          <InlineForm>
            <FormInput
              placeholder={t("Search interventions\u2026")}
              value={interventionQuery}
              onChange={(e) => setInterventionQuery(e.target.value)}
              autoFocus
            />
            <SearchResults>
              {availableInterventions.slice(0, 5).map((intervention) => (
                <SearchResultItem
                  key={intervention.id}
                  onClick={() => handleLinkIntervention(intervention)}
                >
                  {intervention.name}
                  {intervention.category && (
                    <ResultMeta>{intervention.category}</ResultMeta>
                  )}
                </SearchResultItem>
              ))}
              {availableInterventions.length === 0 && (
                <EmptyHint>{t("No matching interventions found.")}</EmptyHint>
              )}
            </SearchResults>
          </InlineForm>
        )}

        {links.length === 0 && !showInterventionSearch ? (
          <EmptyHint>{t("No interventions linked.")}</EmptyHint>
        ) : (
          <ItemList>
            {links.map((link) => {
              const intervention = interventions.get(link.interventionId);
              return (
                <InterventionItem key={link.id}>
                  <ItemContent>
                    <InterventionName>
                      {intervention?.name ?? link.interventionId}
                    </InterventionName>
                    {link.evidenceLevel && (
                      <EvidenceMeta>{link.evidenceLevel}</EvidenceMeta>
                    )}
                  </ItemContent>
                  <RemoveButton
                    onClick={() => handleUnlinkIntervention(link.id)}
                    title={t("Unlink")}
                  >
                    <CloseIcon size={12} />
                  </RemoveButton>
                </InterventionItem>
              );
            })}
          </ItemList>
        )}
      </PanelSection>

      <PanelSection>
        <SectionHeader>
          <PanelTitle>
            {t("Evidence")} ({evidence.length})
          </PanelTitle>
          <Flex gap={4}>
            <AddButton
              onClick={() => setShowPubMedSearch(!showPubMedSearch)}
              title={t("Search PubMed")}
            >
              <SearchIcon size={14} />
            </AddButton>
            <AddButton
              onClick={() => setShowEvidenceForm(!showEvidenceForm)}
              title={t("Add manually")}
            >
              <PlusIcon size={14} />
            </AddButton>
          </Flex>
        </SectionHeader>

        {showPubMedSearch && (
          <SearchPanel>
            <PubMedSearch
              conditionId={condition.id}
              onImport={() => {
                void evidenceEntries.fetchPage({ conditionId: condition.id });
                setShowPubMedSearch(false);
                toast.success(t("Evidence imported from PubMed"));
              }}
            />
          </SearchPanel>
        )}

        {showEvidenceForm && (
          <InlineForm>
            <FormInput
              placeholder={t("Title (required)")}
              value={evidenceTitle}
              onChange={(e) => setEvidenceTitle(e.target.value)}
              autoFocus
            />
            <FormInput
              placeholder={t("Journal")}
              value={evidenceJournal}
              onChange={(e) => setEvidenceJournal(e.target.value)}
            />
            <FormInput
              placeholder={t("DOI")}
              value={evidenceDoi}
              onChange={(e) => setEvidenceDoi(e.target.value)}
            />
            <FormActions>
              <FormButton onClick={handleAddEvidence} $primary>
                {t("Add")}
              </FormButton>
              <FormButton onClick={() => setShowEvidenceForm(false)}>
                {t("Cancel")}
              </FormButton>
            </FormActions>
          </InlineForm>
        )}

        {evidence.length === 0 && !showEvidenceForm ? (
          <EmptyHint>{t("No evidence entries linked.")}</EmptyHint>
        ) : (
          <ItemList>
            {evidence.slice(0, 5).map((entry) => (
              <EvidenceItem key={entry.id}>
                <ItemContent>
                  <EvidenceTitle>{entry.title}</EvidenceTitle>
                  {entry.journal && (
                    <EvidenceMeta>{entry.journal}</EvidenceMeta>
                  )}
                </ItemContent>
                <RemoveButton
                  onClick={() => handleDeleteEvidence(entry)}
                  title={t("Remove")}
                >
                  <CloseIcon size={12} />
                </RemoveButton>
              </EvidenceItem>
            ))}
            {evidence.length > 5 && (
              <MoreLink>
                {t("and {{count}} more\u2026", { count: evidence.length - 5 })}
              </MoreLink>
            )}
          </ItemList>
        )}
      </PanelSection>

      <PanelSection>
        <SectionHeader>
          <PanelTitle>{t("Clinical Trials")}</PanelTitle>
          <AddButton
            onClick={() => setShowClinicalTrials(!showClinicalTrials)}
            title={t("Search clinical trials")}
          >
            <SearchIcon size={14} />
          </AddButton>
        </SectionHeader>
        {showClinicalTrials && (
          <SearchPanel>
            <ClinicalTrialSearch defaultQuery={condition.name} />
          </SearchPanel>
        )}
        {!showClinicalTrials && (
          <EmptyHint>
            {t("Search ClinicalTrials.gov for related studies.")}
          </EmptyHint>
        )}
      </PanelSection>

      <PanelSection>
        <SectionHeader>
          <PanelTitle>
            {t("Scriptures")} ({conditionScriptures.length})
          </PanelTitle>
          <Flex gap={4}>
            <AddButton
              onClick={() => setShowBibleSearch(!showBibleSearch)}
              title={t("Search Bible")}
            >
              <SearchIcon size={14} />
            </AddButton>
            <AddButton
              onClick={() => setShowScriptureForm(!showScriptureForm)}
              title={t("Add manually")}
            >
              <PlusIcon size={14} />
            </AddButton>
          </Flex>
        </SectionHeader>

        {showBibleSearch && (
          <SearchPanel>
            <BibleSearch
              defaultQuery="health healing"
              onSelect={async (reference, text) => {
                await scriptures.create({
                  reference,
                  text,
                  spiritOfProphecy: false,
                  conditionId: condition.id,
                });
                setShowBibleSearch(false);
                toast.success(t("Scripture reference added"));
              }}
            />
          </SearchPanel>
        )}

        {showScriptureForm && (
          <InlineForm>
            <FormInput
              placeholder={t("Reference, e.g. John 3:16 (required)")}
              value={scriptureRef}
              onChange={(e) => setScriptureRef(e.target.value)}
              autoFocus
            />
            <FormTextarea
              placeholder={t("Text (optional)")}
              value={scriptureText}
              onChange={(e) => setScriptureText(e.target.value)}
              rows={2}
            />
            <CheckboxRow>
              <input
                type="checkbox"
                id="sop-checkbox"
                checked={isSop}
                onChange={(e) => setIsSop(e.target.checked)}
              />
              <CheckboxLabel htmlFor="sop-checkbox">
                {t("Spirit of Prophecy")}
              </CheckboxLabel>
            </CheckboxRow>
            {isSop && (
              <FormInput
                placeholder={t("Source book")}
                value={sopSource}
                onChange={(e) => setSopSource(e.target.value)}
              />
            )}
            <FormActions>
              <FormButton onClick={handleAddScripture} $primary>
                {t("Add")}
              </FormButton>
              <FormButton onClick={() => setShowScriptureForm(false)}>
                {t("Cancel")}
              </FormButton>
            </FormActions>
          </InlineForm>
        )}

        {conditionScriptures.length === 0 && !showScriptureForm ? (
          <EmptyHint>{t("No scripture references linked.")}</EmptyHint>
        ) : (
          <ItemList>
            {conditionScriptures.slice(0, 5).map((scripture) => (
              <ScriptureItem key={scripture.id}>
                <ItemContent>
                  <ScriptureRef>{scripture.reference}</ScriptureRef>
                  {scripture.spiritOfProphecy && (
                    <SopBadge>{t("SoP")}</SopBadge>
                  )}
                </ItemContent>
                <RemoveButton
                  onClick={() => handleDeleteScripture(scripture)}
                  title={t("Remove")}
                >
                  <CloseIcon size={12} />
                </RemoveButton>
              </ScriptureItem>
            ))}
          </ItemList>
        )}
      </PanelSection>

      <PanelSection>
        <PanelTitle>{t("AI Suggestions")}</PanelTitle>
        <AISuggestRow>
          <AISectionSelect
            value={aiSectionType}
            onChange={(e) => {
              setAiSectionType(e.target.value);
              setAiSuggestions(null);
            }}
          >
            <option value="risk_factors">{t("Risk Factors")}</option>
            <option value="physiology">{t("Physiology")}</option>
            <option value="complications">{t("Complications")}</option>
            <option value="solutions">{t("Solutions")}</option>
            <option value="bible_sop">{t("Bible & SoP")}</option>
            <option value="research_ideas">{t("Research Ideas")}</option>
          </AISectionSelect>
          <SuggestButton
            onClick={handleGetSuggestions}
            disabled={isLoadingSuggestions}
          >
            {isLoadingSuggestions ? t("Loading\u2026") : t("Suggest")}
          </SuggestButton>
        </AISuggestRow>
        {aiSuggestions && (
          <SuggestionsContent>{aiSuggestions}</SuggestionsContent>
        )}
      </PanelSection>
    </Panel>
  );
}

const Panel = styled.div`
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  overflow: hidden;
`;

const PanelSection = styled.div`
  padding: 12px 16px;

  &:not(:last-child) {
    border-bottom: 1px solid ${s("divider")};
  }
`;

const SectionHeader = styled(Flex)`
  justify-content: space-between;
  align-items: center;
`;

const PanelTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${s("textTertiary")};
  letter-spacing: 0.5px;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid ${s("divider")};
  border-radius: 4px;
  background: none;
  color: ${s("textTertiary")};
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    color: ${s("accent")};
    border-color: ${s("accent")};
  }
`;

const StatusSelect = styled.select`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid ${s("divider")};
  border-radius: 4px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 13px;
`;

const MetaField = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
`;

const MetaLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${s("textSecondary")};
`;

const MetaValue = styled.span`
  font-size: 13px;
  color: ${s("text")};
`;

const EmptyHint = styled.div`
  font-size: 12px;
  color: ${s("textTertiary")};
  font-style: italic;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const InterventionItem = styled(Flex)`
  align-items: center;
  gap: 4px;
  padding: 4px 0;
`;

const InterventionName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${s("text")};
`;

const SearchResults = styled.div`
  max-height: 150px;
  overflow-y: auto;
`;

const SearchResultItem = styled.div`
  padding: 6px 8px;
  font-size: 12px;
  color: ${s("text")};
  cursor: pointer;
  border-radius: 4px;
  transition: background 100ms ease;

  &:hover {
    background: ${s("listItemHoverBackground")};
  }
`;

const ResultMeta = styled.span`
  font-size: 11px;
  color: ${s("textTertiary")};
  margin-left: 6px;
`;

const EvidenceItem = styled(Flex)`
  align-items: flex-start;
  gap: 4px;
  padding: 6px 0;
`;

const EvidenceTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${s("text")};
  line-height: 1.3;
`;

const EvidenceMeta = styled.div`
  font-size: 11px;
  color: ${s("textTertiary")};
  margin-top: 2px;
`;

const ScriptureItem = styled(Flex)`
  align-items: center;
  gap: 4px;
  padding: 4px 0;
`;

const ScriptureRef = styled.span`
  font-size: 13px;
  color: ${s("text")};
`;

const SopBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
  background: #e8d5f5;
  color: #6b21a8;
  flex-shrink: 0;
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  border-radius: 3px;
  color: ${s("textTertiary")};
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 100ms ease, color 100ms ease;

  ${InterventionItem}:hover &,
  ${EvidenceItem}:hover &,
  ${ScriptureItem}:hover & {
    opacity: 1;
  }

  &:hover {
    color: ${(props) => props.theme.danger};
  }
`;

const MoreLink = styled.div`
  font-size: 12px;
  color: ${s("accent")};
  cursor: pointer;
`;

const InlineForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("sidebarBackground")};
`;

const FormInput = styled.input`
  width: 100%;
  padding: 5px 8px;
  border: 1px solid ${s("divider")};
  border-radius: 4px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 12px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: ${s("accent")};
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 5px 8px;
  border: 1px solid ${s("divider")};
  border-radius: 4px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 12px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: ${s("accent")};
  }
`;

const CheckboxRow = styled(Flex)`
  align-items: center;
  gap: 6px;
`;

const CheckboxLabel = styled.label`
  font-size: 12px;
  color: ${s("textSecondary")};
  cursor: pointer;
`;

const FormActions = styled(Flex)`
  gap: 6px;
  justify-content: flex-end;
`;

const FormButton = styled.button<{ $primary?: boolean }>`
  padding: 4px 12px;
  border: 1px solid ${(props) => (props.$primary ? "transparent" : props.theme.divider)};
  border-radius: 4px;
  background: ${(props) => (props.$primary ? props.theme.accent : "transparent")};
  color: ${(props) => (props.$primary ? "white" : props.theme.textSecondary)};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    opacity: 0.9;
  }
`;

const SearchPanel = styled.div`
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("sidebarBackground")};
`;

const AISuggestRow = styled(Flex)`
  gap: 6px;
  margin-bottom: 8px;
`;

const AISectionSelect = styled.select`
  flex: 1;
  padding: 5px 8px;
  border: 1px solid ${s("divider")};
  border-radius: 4px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 12px;
`;

const SuggestButton = styled.button`
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  background: ${s("accent")};
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 100ms ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuggestionsContent = styled.pre`
  font-size: 12px;
  line-height: 1.5;
  color: ${s("text")};
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  padding: 8px;
  border: 1px solid ${s("divider")};
  border-radius: 4px;
  background: ${s("sidebarBackground")};
`;

export default observer(MetadataPanel);
