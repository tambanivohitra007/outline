import { observer } from "mobx-react";
import { BookmarkedIcon, PlusIcon, CloseIcon, TrashIcon, SearchIcon } from "outline-icons";
import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Action } from "~/components/Actions";
import Button from "~/components/Button";
import Empty from "~/components/Empty";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import Scene from "~/components/Scene";
import Subheading from "~/components/Subheading";
import Text from "~/components/Text";
import useStores from "~/hooks/useStores";
import { client } from "~/utils/ApiClient";
import styled, { css } from "styled-components";
import { s } from "@shared/styles";
import type CareDomain from "~/models/CareDomain";
import type Condition from "~/models/Condition";
import type Scripture from "~/models/Scripture";

/* ── Types for API results ── */

interface BibleSearchResult {
  reference: string;
  text: string;
}

interface EgwSearchResult {
  reference: string;
  text: string;
  bookTitle: string;
  bookId: number;
  paraId: string;
}

interface EgwBook {
  id: number;
  title: string;
  abbreviation: string;
  author: string;
}

interface EgwTocEntry {
  title: string;
  paraId: string;
  level: number;
}

interface EgwParagraph {
  paraId: string;
  text: string;
  refcode: string;
}

type ApiTab = "bible" | "egw";

function BibleExplorer() {
  const { t } = useTranslation();
  const { scriptures, careDomains, conditions } = useStores();

  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [showSopOnly, setShowSopOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formReference, setFormReference] = useState("");
  const [formText, setFormText] = useState("");
  const [formBook, setFormBook] = useState("");
  const [formChapter, setFormChapter] = useState("");
  const [formVerseStart, setFormVerseStart] = useState("");
  const [formVerseEnd, setFormVerseEnd] = useState("");
  const [formTheme, setFormTheme] = useState("");
  const [formConditionId, setFormConditionId] = useState("");
  const [formCareDomainId, setFormCareDomainId] = useState("");
  const [formIsSop, setFormIsSop] = useState(false);
  const [formSopSource, setFormSopSource] = useState("");
  const [formSopPage, setFormSopPage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // API search state
  const [apiTab, setApiTab] = useState<ApiTab>("bible");
  const [bibleQuery, setBibleQuery] = useState("");
  const [bibleResults, setBibleResults] = useState<BibleSearchResult[]>([]);
  const [bibleSearching, setBibleSearching] = useState(false);
  const [bibleError, setBibleError] = useState("");
  const [egwQuery, setEgwQuery] = useState("");
  const [egwResults, setEgwResults] = useState<EgwSearchResult[]>([]);
  const [egwSearching, setEgwSearching] = useState(false);
  const [egwError, setEgwError] = useState("");
  // EGW book browser
  const [egwBooks, setEgwBooks] = useState<EgwBook[]>([]);
  const [egwBookSearch, setEgwBookSearch] = useState("");
  const [egwSelectedBook, setEgwSelectedBook] = useState<EgwBook | null>(null);
  const [egwToc, setEgwToc] = useState<EgwTocEntry[]>([]);
  const [egwContent, setEgwContent] = useState<EgwParagraph[]>([]);
  const [egwLoadingContent, setEgwLoadingContent] = useState(false);

  const bibleTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const egwTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Bible API search with debounce
  const handleBibleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setBibleResults([]);
      setBibleError("");
      return;
    }
    setBibleSearching(true);
    setBibleError("");
    try {
      const res = await client.post("/medical.bible.search", { query, limit: 25 });
      setBibleResults(res.data ?? []);
      if ((res.data ?? []).length === 0) {
        setBibleError(t("No results found for this query."));
      }
    } catch (err) {
      setBibleResults([]);
      setBibleError((err as Error).message || t("Bible API request failed."));
    } finally {
      setBibleSearching(false);
    }
  }, [t]);

  const handleBibleQueryChange = useCallback((value: string) => {
    setBibleQuery(value);
    clearTimeout(bibleTimerRef.current);
    bibleTimerRef.current = setTimeout(() => handleBibleSearch(value), 400);
  }, [handleBibleSearch]);

  // EGW search with debounce
  const handleEgwSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setEgwResults([]);
      setEgwError("");
      return;
    }
    setEgwSearching(true);
    setEgwError("");
    try {
      const res = await client.post("/medical.egw.search", { query, limit: 25 });
      setEgwResults(res.data ?? []);
      if ((res.data ?? []).length === 0) {
        setEgwError(t("No results found for this query."));
      }
    } catch (err) {
      setEgwResults([]);
      setEgwError((err as Error).message || t("EGW API request failed."));
    } finally {
      setEgwSearching(false);
    }
  }, [t]);

  const handleEgwQueryChange = useCallback((value: string) => {
    setEgwQuery(value);
    clearTimeout(egwTimerRef.current);
    egwTimerRef.current = setTimeout(() => handleEgwSearch(value), 400);
  }, [handleEgwSearch]);

  // Load EGW books
  const handleLoadEgwBooks = useCallback(async (searchTerm?: string) => {
    try {
      const res = await client.post("/medical.egw.books", {
        search: searchTerm || undefined,
      });
      setEgwBooks(res.data ?? []);
    } catch {
      setEgwBooks([]);
    }
  }, []);

  // Load EGW book TOC
  const handleSelectEgwBook = useCallback(async (book: EgwBook) => {
    setEgwSelectedBook(book);
    setEgwContent([]);
    try {
      const res = await client.post("/medical.egw.toc", { bookId: book.id });
      setEgwToc(res.data ?? []);
    } catch {
      setEgwToc([]);
    }
  }, []);

  // Load EGW chapter content
  const handleLoadEgwContent = useCallback(async (bookId: number, paraId: string) => {
    setEgwLoadingContent(true);
    try {
      const res = await client.post("/medical.egw.content", { bookId, paraId });
      setEgwContent(res.data ?? []);
    } catch {
      setEgwContent([]);
    } finally {
      setEgwLoadingContent(false);
    }
  }, []);

  // Save an API result as a local scripture
  const handleSaveFromApi = useCallback(async (
    reference: string,
    text: string,
    isSop: boolean,
    sopSource?: string
  ) => {
    try {
      await scriptures.create({
        reference,
        text,
        spiritOfProphecy: isSop,
        sopSource: sopSource || undefined,
        conditionId: selectedCondition || undefined,
        careDomainId: selectedDomain || undefined,
      });
      toast.success(t("Saved to your collection"));
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [scriptures, t, selectedCondition, selectedDomain]);

  useEffect(() => {
    void scriptures.fetchPage({ limit: 200 });
    void careDomains.fetchPage();
    void conditions.fetchPage();
  }, [scriptures, careDomains, conditions]);

  const allScriptures = scriptures.orderedData;
  const allDomains = careDomains.orderedData;
  const allConditions = conditions.orderedData;

  const filtered = useMemo(() => {
    let data = allScriptures;

    if (showSopOnly) {
      data = data.filter((s) => s.spiritOfProphecy);
    }

    if (selectedDomain) {
      data = data.filter((s) => s.careDomainId === selectedDomain);
    }

    if (selectedCondition) {
      data = data.filter((s) => s.conditionId === selectedCondition);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (s) =>
          s.reference.toLowerCase().includes(q) ||
          s.text?.toLowerCase().includes(q) ||
          s.book?.toLowerCase().includes(q) ||
          s.theme?.toLowerCase().includes(q) ||
          s.sopSource?.toLowerCase().includes(q)
      );
    }

    return data;
  }, [allScriptures, selectedDomain, selectedCondition, showSopOnly, search]);

  // Group scriptures by care domain for the overview
  const groupedByDomain = useMemo(() => {
    const groups = new Map<string | null, Scripture[]>();
    for (const s of filtered) {
      const key = s.careDomainId || null;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(s);
    }
    return groups;
  }, [filtered]);

  const getDomainById = useCallback(
    (id: string | null): CareDomain | undefined => {
      if (!id) {
        return undefined;
      }
      return allDomains.find((d) => d.id === id);
    },
    [allDomains]
  );

  const getConditionById = useCallback(
    (id: string | null): Condition | undefined => {
      if (!id) {
        return undefined;
      }
      return allConditions.find((c) => c.id === id);
    },
    [allConditions]
  );

  const handleCreate = useCallback(async () => {
    if (!formReference.trim()) {
      return;
    }
    setIsCreating(true);
    try {
      await scriptures.create({
        reference: formReference.trim(),
        text: formText.trim() || undefined,
        book: formBook.trim() || undefined,
        chapter: formChapter ? parseInt(formChapter, 10) : undefined,
        verseStart: formVerseStart ? parseInt(formVerseStart, 10) : undefined,
        verseEnd: formVerseEnd ? parseInt(formVerseEnd, 10) : undefined,
        theme: formTheme.trim() || undefined,
        conditionId: formConditionId || undefined,
        careDomainId: formCareDomainId || undefined,
        spiritOfProphecy: formIsSop,
        sopSource: formIsSop ? formSopSource.trim() || undefined : undefined,
        sopPage: formIsSop ? formSopPage.trim() || undefined : undefined,
      });
      toast.success(t("Scripture added"));
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  }, [
    scriptures, t,
    formReference, formText, formBook, formChapter, formVerseStart, formVerseEnd,
    formTheme, formConditionId, formCareDomainId, formIsSop, formSopSource, formSopPage,
  ]);

  const handleDelete = useCallback(
    async (scripture: Scripture) => {
      const confirmed = window.confirm(
        t("Delete scripture \"{{ ref }}\"?", { ref: scripture.reference })
      );
      if (!confirmed) {
        return;
      }
      await scriptures.delete(scripture);
      toast.success(t("Scripture deleted"));
    },
    [scriptures, t]
  );

  const resetForm = () => {
    setFormReference("");
    setFormText("");
    setFormBook("");
    setFormChapter("");
    setFormVerseStart("");
    setFormVerseEnd("");
    setFormTheme("");
    setFormConditionId("");
    setFormCareDomainId("");
    setFormIsSop(false);
    setFormSopSource("");
    setFormSopPage("");
  };

  return (
    <Scene
      icon={<BookmarkedIcon />}
      title={t("Bible Explorer")}
      actions={
        <Action>
          <Button icon={<PlusIcon />} onClick={() => setShowAddForm(true)}>
            {t("Add Scripture")}
          </Button>
        </Action>
      }
    >
      <Heading>{t("Bible & Spirit of Prophecy Explorer")}</Heading>
      <Text as="p" size="large">
        {t(
          "Connect scripture and Spirit of Prophecy references to care domains and medical conditions. Browse by category to find spiritual guidance relevant to patient care."
        )}
      </Text>

      {/* API Search Panels */}
      <ApiSection>
        <ApiTabs>
          <ApiTabBtn $active={apiTab === "bible"} onClick={() => setApiTab("bible")}>
            {t("Bible API")}
          </ApiTabBtn>
          <ApiTabBtn $active={apiTab === "egw"} onClick={() => setApiTab("egw")}>
            {t("Ellen G. White API")}
          </ApiTabBtn>
        </ApiTabs>

        {apiTab === "bible" && (
          <ApiPanel>
            <ApiPanelHeader>
              <ApiSearchRow>
                <ApiSearchInput
                  placeholder={t("Search Bible verses (e.g. \u201Ctemperance\u201D, \u201Chealing\u201D, \u201Cbody is a temple\u201D)\u2026")}
                  value={bibleQuery}
                  onChange={(e) => handleBibleQueryChange(e.target.value)}
                />
                <ApiSearchBtn
                  onClick={() => handleBibleSearch(bibleQuery)}
                  disabled={bibleSearching}
                >
                  <SearchIcon size={16} />
                </ApiSearchBtn>
              </ApiSearchRow>
              {bibleSearching && <ApiStatus>{t("Searching")}\u2026</ApiStatus>}
            </ApiPanelHeader>
            {bibleResults.length > 0 && (
              <ApiResultsList>
                {bibleResults.map((r, i) => (
                  <ApiResultCard key={i}>
                    <ApiResultRef>{r.reference}</ApiResultRef>
                    <ApiResultText>{r.text}</ApiResultText>
                    <SaveBtn onClick={() => handleSaveFromApi(r.reference, r.text, false)}>
                      + {t("Save to Collection")}
                    </SaveBtn>
                  </ApiResultCard>
                ))}
              </ApiResultsList>
            )}
            {bibleError && (
              <ApiError>{bibleError}</ApiError>
            )}
          </ApiPanel>
        )}

        {apiTab === "egw" && (
          <ApiPanel>
            {/* EGW Search */}
            <ApiPanelHeader>
              <ApiSearchRow>
                <ApiSearchInput
                  placeholder={t("Search Ellen G. White writings (e.g. \u201Cnatural remedies\u201D, \u201Chealth reform\u201D)\u2026")}
                  value={egwQuery}
                  onChange={(e) => handleEgwQueryChange(e.target.value)}
                />
                <ApiSearchBtn
                  onClick={() => handleEgwSearch(egwQuery)}
                  disabled={egwSearching}
                >
                  <SearchIcon size={16} />
                </ApiSearchBtn>
              </ApiSearchRow>
              {egwSearching && <ApiStatus>{t("Searching")}\u2026</ApiStatus>}
            </ApiPanelHeader>

            {egwResults.length > 0 && (
              <ApiResultsList>
                {egwResults.map((r, i) => (
                  <ApiResultCard key={i} $sop>
                    <ApiResultRef>{r.reference}</ApiResultRef>
                    {r.bookTitle && <ApiResultBook>{r.bookTitle}</ApiResultBook>}
                    <ApiResultText>{r.text}</ApiResultText>
                    <SaveBtn onClick={() => handleSaveFromApi(
                      r.reference, r.text, true, r.bookTitle
                    )}>
                      + {t("Save to Collection")}
                    </SaveBtn>
                  </ApiResultCard>
                ))}
              </ApiResultsList>
            )}

            {egwError && (
              <ApiError>{egwError}</ApiError>
            )}

            {/* EGW Book Browser */}
            <EgwBrowserSection>
              <EgwBrowserTitle>{t("Browse Books")}</EgwBrowserTitle>
              <ApiSearchRow>
                <ApiSearchInput
                  placeholder={t("Filter books (e.g. \u201CMinistry of Healing\u201D)\u2026")}
                  value={egwBookSearch}
                  onChange={(e) => setEgwBookSearch(e.target.value)}
                />
                <ApiSearchBtn onClick={() => handleLoadEgwBooks(egwBookSearch)}>
                  {t("Load")}
                </ApiSearchBtn>
              </ApiSearchRow>

              {egwBooks.length > 0 && (
                <EgwBookGrid>
                  {egwBooks.slice(0, 50).map((book) => (
                    <EgwBookCard
                      key={book.id}
                      $active={egwSelectedBook?.id === book.id}
                      onClick={() => handleSelectEgwBook(book)}
                    >
                      <EgwBookTitle>{book.title}</EgwBookTitle>
                      {book.abbreviation && (
                        <EgwBookAbbr>{book.abbreviation}</EgwBookAbbr>
                      )}
                    </EgwBookCard>
                  ))}
                </EgwBookGrid>
              )}

              {/* TOC */}
              {egwSelectedBook && egwToc.length > 0 && (
                <EgwTocSection>
                  <EgwBrowserTitle>
                    {egwSelectedBook.title} &mdash; {t("Table of Contents")}
                  </EgwBrowserTitle>
                  <EgwTocList>
                    {egwToc.map((entry, i) => (
                      <EgwTocItem
                        key={i}
                        $level={entry.level}
                        onClick={() =>
                          handleLoadEgwContent(egwSelectedBook.id, entry.paraId)
                        }
                      >
                        {entry.title}
                      </EgwTocItem>
                    ))}
                  </EgwTocList>
                </EgwTocSection>
              )}

              {/* Content reader */}
              {egwLoadingContent && <ApiStatus>{t("Loading content")}\u2026</ApiStatus>}
              {egwContent.length > 0 && (
                <EgwContentSection>
                  {egwContent.map((p, i) => (
                    <EgwPara key={i}>
                      {p.refcode && <EgwRefcode>{p.refcode}</EgwRefcode>}
                      <span>{p.text}</span>
                      <SaveBtn
                        onClick={() =>
                          handleSaveFromApi(
                            p.refcode || `${egwSelectedBook?.title}, para ${p.paraId}`,
                            p.text,
                            true,
                            egwSelectedBook?.title
                          )
                        }
                      >
                        +
                      </SaveBtn>
                    </EgwPara>
                  ))}
                </EgwContentSection>
              )}
            </EgwBrowserSection>
          </ApiPanel>
        )}
      </ApiSection>

      {/* Add form */}
      {showAddForm && (
        <AddFormCard>
          <AddFormHeader>
            <AddFormTitle>{t("Add Scripture / SoP Reference")}</AddFormTitle>
            <CloseBtn onClick={() => { setShowAddForm(false); resetForm(); }}>
              <CloseIcon size={16} />
            </CloseBtn>
          </AddFormHeader>

          <FormGrid>
            <FormGroup $span={2}>
              <FormLabel>{t("Reference")} *</FormLabel>
              <FormInput
                placeholder={t("e.g. 1 Corinthians 6:19-20")}
                value={formReference}
                onChange={(e) => setFormReference(e.target.value)}
                autoFocus
              />
            </FormGroup>

            <FormGroup $span={3}>
              <FormLabel>{t("Full Text")}</FormLabel>
              <FormTextarea
                placeholder={t("Paste the scripture text here\u2026")}
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                rows={3}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>{t("Book")}</FormLabel>
              <FormInput
                placeholder={t("e.g. Genesis")}
                value={formBook}
                onChange={(e) => setFormBook(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>{t("Chapter")}</FormLabel>
              <FormInput
                type="number"
                placeholder="1"
                value={formChapter}
                onChange={(e) => setFormChapter(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>{t("Verses")}</FormLabel>
              <VerseFlex>
                <FormInput
                  type="number"
                  placeholder={t("Start")}
                  value={formVerseStart}
                  onChange={(e) => setFormVerseStart(e.target.value)}
                />
                <VerseDelim>&ndash;</VerseDelim>
                <FormInput
                  type="number"
                  placeholder={t("End")}
                  value={formVerseEnd}
                  onChange={(e) => setFormVerseEnd(e.target.value)}
                />
              </VerseFlex>
            </FormGroup>

            <FormGroup>
              <FormLabel>{t("Condition")}</FormLabel>
              <FormSelect
                value={formConditionId}
                onChange={(e) => setFormConditionId(e.target.value)}
              >
                <option value="">{t("None")}</option>
                {allConditions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </FormSelect>
            </FormGroup>
            <FormGroup>
              <FormLabel>{t("Care Domain")}</FormLabel>
              <FormSelect
                value={formCareDomainId}
                onChange={(e) => setFormCareDomainId(e.target.value)}
              >
                <option value="">{t("None")}</option>
                {allDomains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </FormSelect>
            </FormGroup>
            <FormGroup>
              <FormLabel>{t("Theme")}</FormLabel>
              <FormInput
                placeholder={t("e.g. temperance, healing")}
                value={formTheme}
                onChange={(e) => setFormTheme(e.target.value)}
              />
            </FormGroup>

            <FormGroup $span={3}>
              <CheckboxRow>
                <input
                  type="checkbox"
                  id="sop-toggle"
                  checked={formIsSop}
                  onChange={(e) => setFormIsSop(e.target.checked)}
                />
                <label htmlFor="sop-toggle">{t("This is a Spirit of Prophecy quote")}</label>
              </CheckboxRow>
            </FormGroup>

            {formIsSop && (
              <>
                <FormGroup>
                  <FormLabel>{t("SoP Source")}</FormLabel>
                  <FormInput
                    placeholder={t("e.g. Ministry of Healing")}
                    value={formSopSource}
                    onChange={(e) => setFormSopSource(e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t("SoP Page")}</FormLabel>
                  <FormInput
                    placeholder={t("e.g. p. 127")}
                    value={formSopPage}
                    onChange={(e) => setFormSopPage(e.target.value)}
                  />
                </FormGroup>
              </>
            )}
          </FormGrid>

          <FormActions>
            <CreateBtn onClick={handleCreate} disabled={!formReference.trim() || isCreating}>
              {isCreating ? `${t("Adding")}\u2026` : t("Add Scripture")}
            </CreateBtn>
            <CancelBtn onClick={() => { setShowAddForm(false); resetForm(); }}>
              {t("Cancel")}
            </CancelBtn>
          </FormActions>
        </AddFormCard>
      )}

      {/* Filters */}
      <FilterBar>
        <SearchInput
          placeholder={t("Search scriptures, books, themes\u2026")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterChips>
          <FilterChip
            $active={showSopOnly}
            onClick={() => setShowSopOnly(!showSopOnly)}
          >
            {t("Spirit of Prophecy")}
          </FilterChip>
        </FilterChips>
      </FilterBar>

      {/* Care domain pills */}
      <DomainBar>
        <DomainPill
          $active={!selectedDomain}
          $color="#6b7280"
          onClick={() => setSelectedDomain(null)}
        >
          {t("All Domains")}
        </DomainPill>
        {allDomains.map((d) => (
          <DomainPill
            key={d.id}
            $active={selectedDomain === d.id}
            $color={d.color || "#6b7280"}
            onClick={() => setSelectedDomain(selectedDomain === d.id ? null : d.id)}
          >
            {d.name}
          </DomainPill>
        ))}
      </DomainBar>

      {/* Condition filter */}
      <ConditionBar>
        <ConditionLabel>{t("Condition")}:</ConditionLabel>
        <ConditionSelect
          value={selectedCondition || ""}
          onChange={(e) => setSelectedCondition(e.target.value || null)}
        >
          <option value="">{t("All Conditions")}</option>
          {allConditions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </ConditionSelect>
      </ConditionBar>

      <Subheading sticky>
        {t("Scriptures")} ({filtered.length})
      </Subheading>

      {filtered.length === 0 && scriptures.isLoaded ? (
        <Empty>
          {search.trim()
            ? t("No scriptures matching your search.")
            : t("No scriptures found. Add some to get started.")}
        </Empty>
      ) : (
        <>
          {/* If no domain filter, group by domain */}
          {!selectedDomain ? (
            Array.from(groupedByDomain.entries())
              .sort(([a], [b]) => {
                if (!a) { return 1; }
                if (!b) { return -1; }
                const da = getDomainById(a);
                const db = getDomainById(b);
                return (da?.sortOrder ?? 99) - (db?.sortOrder ?? 99);
              })
              .map(([domainId, items]) => {
                const domain = getDomainById(domainId);
                return (
                  <DomainSection key={domainId || "unlinked"}>
                    <DomainSectionHeader $color={domain?.color || "#6b7280"}>
                      <DomainDot $color={domain?.color || "#6b7280"} />
                      {domain?.name || t("Unlinked")}
                      <DomainCount>{items.length}</DomainCount>
                    </DomainSectionHeader>
                    <ScriptureList>
                      {items.map((s) => (
                        <ScriptureCard key={s.id} $sop={s.spiritOfProphecy}>
                          <CardTop>
                            <ReferenceText>{s.reference}</ReferenceText>
                            <CardMeta>
                              {s.spiritOfProphecy && <SopBadge>{t("SoP")}</SopBadge>}
                              {s.theme && <ThemeBadge>{s.theme}</ThemeBadge>}
                              <DeleteBtn
                                onClick={() => handleDelete(s)}
                                title={t("Delete")}
                              >
                                <TrashIcon size={14} />
                              </DeleteBtn>
                            </CardMeta>
                          </CardTop>
                          {s.text && <QuoteText>{s.text}</QuoteText>}
                          <CardBottom>
                            {s.translation && <DetailChip>{s.translation}</DetailChip>}
                            {s.sopSource && (
                              <DetailChip>
                                {s.sopSource}
                                {s.sopPage ? `, ${s.sopPage}` : ""}
                              </DetailChip>
                            )}
                            {s.conditionId && (
                              <ConditionChip>
                                {getConditionById(s.conditionId)?.name || t("Condition")}
                              </ConditionChip>
                            )}
                          </CardBottom>
                        </ScriptureCard>
                      ))}
                    </ScriptureList>
                  </DomainSection>
                );
              })
          ) : (
            <ScriptureList>
              {filtered.map((s) => (
                <ScriptureCard key={s.id} $sop={s.spiritOfProphecy}>
                  <CardTop>
                    <ReferenceText>{s.reference}</ReferenceText>
                    <CardMeta>
                      {s.spiritOfProphecy && <SopBadge>{t("SoP")}</SopBadge>}
                      {s.theme && <ThemeBadge>{s.theme}</ThemeBadge>}
                      <DeleteBtn
                        onClick={() => handleDelete(s)}
                        title={t("Delete")}
                      >
                        <TrashIcon size={14} />
                      </DeleteBtn>
                    </CardMeta>
                  </CardTop>
                  {s.text && <QuoteText>{s.text}</QuoteText>}
                  <CardBottom>
                    {s.translation && <DetailChip>{s.translation}</DetailChip>}
                    {s.sopSource && (
                      <DetailChip>
                        {s.sopSource}
                        {s.sopPage ? `, ${s.sopPage}` : ""}
                      </DetailChip>
                    )}
                    {s.conditionId && (
                      <ConditionChip>
                        {getConditionById(s.conditionId)?.name || t("Condition")}
                      </ConditionChip>
                    )}
                  </CardBottom>
                </ScriptureCard>
              ))}
            </ScriptureList>
          )}
        </>
      )}
    </Scene>
  );
}

/* ── Styled components ── */

const FilterBar = styled(Flex)`
  gap: 16px;
  align-items: center;
  margin: 16px 0 8px;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: ${s("accent")}; }
`;

const FilterChips = styled(Flex)`
  gap: 6px;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  border: 1px solid ${(p) => (p.$active ? p.theme.accent : p.theme.divider)};
  background: ${(p) => (p.$active ? p.theme.accent + "15" : "transparent")};
  color: ${(p) => (p.$active ? p.theme.accent : p.theme.textSecondary)};
  border-radius: 16px;
  padding: 4px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover { border-color: ${(p) => p.theme.accent}; }
`;

const DomainBar = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 8px 0 16px;
`;

const DomainPill = styled.button<{ $active: boolean; $color: string }>`
  border: 1.5px solid ${(p) => (p.$active ? p.$color : p.theme.divider)};
  background: ${(p) => (p.$active ? p.$color + "18" : "transparent")};
  color: ${(p) => (p.$active ? p.$color : p.theme.textSecondary)};
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 120ms ease;
  &:hover {
    border-color: ${(p) => p.$color};
    color: ${(p) => p.$color};
  }
`;

const ConditionBar = styled(Flex)`
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const ConditionLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${s("textSecondary")};
`;

const ConditionSelect = styled.select`
  padding: 6px 10px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 13px;
  outline: none;
  &:focus { border-color: ${s("accent")}; }
`;

/* Domain sections */

const DomainSection = styled.div`
  margin-bottom: 24px;
`;

const DomainSectionHeader = styled.h3<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: ${(p) => p.$color};
  margin: 0 0 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid ${(p) => p.$color + "30"};
`;

const DomainDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
`;

const DomainCount = styled.span`
  font-size: 12px;
  font-weight: 400;
  opacity: 0.6;
  margin-left: auto;
`;

/* Scripture cards */

const ScriptureList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
  gap: 12px;
`;

const ScriptureCard = styled.div<{ $sop: boolean }>`
  border: 1px solid ${(p) => (p.$sop ? "#b45309" + "40" : p.theme.divider)};
  border-left: 3px solid ${(p) => (p.$sop ? "#b45309" : p.theme.accent)};
  border-radius: 8px;
  padding: 14px 16px;
  background: ${(p) => (p.$sop ? "#fffbeb" + "40" : p.theme.background)};
  transition: box-shadow 120ms ease;
  &:hover {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  }
`;

const CardTop = styled(Flex)`
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
`;

const ReferenceText = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${s("text")};
`;

const CardMeta = styled(Flex)`
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const SopBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: #b45309;
  color: white;
`;

const ThemeBadge = styled.span`
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${s("secondaryBackground")};
  color: ${s("textSecondary")};
`;

const QuoteText = styled.blockquote`
  margin: 0 0 8px;
  padding: 8px 12px;
  border-left: 2px solid ${s("textTertiary")};
  font-size: 13px;
  line-height: 1.5;
  color: ${s("textSecondary")};
  font-style: italic;
  background: ${s("secondaryBackground")};
  border-radius: 0 6px 6px 0;
`;

const CardBottom = styled(Flex)`
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

const DetailChip = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${s("secondaryBackground")};
  color: ${s("textTertiary")};
`;

const ConditionChip = styled.span`
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${(p) => p.theme.accent + "15"};
  color: ${(p) => p.theme.accent};
`;

const DeleteBtn = styled.button`
  display: flex;
  align-items: center;
  padding: 2px;
  border: none;
  background: none;
  border-radius: 4px;
  color: ${s("textTertiary")};
  cursor: pointer;
  opacity: 0;
  transition: opacity 100ms, color 100ms;

  ${ScriptureCard}:hover & {
    opacity: 1;
  }

  &:hover {
    color: ${(p) => p.theme.danger};
  }
`;

/* Add form */

const AddFormCard = styled.div`
  border: 1px solid ${s("accent")};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  background: ${s("background")};
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const AddFormHeader = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const AddFormTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${s("text")};
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  padding: 4px;
  border: none;
  background: none;
  border-radius: 4px;
  color: ${s("textTertiary")};
  cursor: pointer;
  &:hover { color: ${s("text")}; }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div<{ $span?: number }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  grid-column: ${(p) => (p.$span ? `span ${p.$span}` : "span 1")};
  min-width: 0;

  @media (max-width: 700px) {
    grid-column: span 1;
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
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  &:focus { border-color: ${s("accent")}; }
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
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  &:focus { border-color: ${s("accent")}; }
`;

const FormSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 14px;
  outline: none;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  &:focus { border-color: ${s("accent")}; }
`;

const VerseFlex = styled(Flex)`
  align-items: center;
  gap: 4px;
`;

const VerseDelim = styled.span`
  color: ${s("textTertiary")};
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${s("text")};
  cursor: pointer;
`;

const FormActions = styled(Flex)`
  gap: 8px;
  margin-top: 16px;
`;

const CreateBtn = styled.button`
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: ${(p) => p.theme.accent};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const CancelBtn = styled.button`
  padding: 8px 20px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: transparent;
  color: ${s("textSecondary")};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:hover { border-color: ${s("text")}; }
`;

/* ── API search panels ── */

const ApiSection = styled.div`
  margin: 20px 0;
  border: 1px solid ${s("divider")};
  border-radius: 10px;
  overflow: hidden;
  max-width: 100%;
`;

const ApiTabs = styled.div`
  display: flex;
  border-bottom: 1px solid ${s("divider")};
`;

const ApiTabBtn = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 10px 16px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 100ms ease;
  ${(p) =>
    p.$active
      ? css`
          background: ${p.theme.accent}10;
          color: ${p.theme.accent};
          border-bottom: 2px solid ${p.theme.accent};
        `
      : css`
          background: transparent;
          color: ${s("textSecondary")};
          border-bottom: 2px solid transparent;
          &:hover { color: ${s("text")}; }
        `}
`;

const ApiPanel = styled.div`
  padding: 16px;
`;

const ApiPanelHeader = styled.div`
  margin-bottom: 12px;
`;

const ApiSearchRow = styled(Flex)`
  gap: 8px;
  align-items: center;
`;

const ApiSearchInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: ${s("accent")}; }
`;

const ApiSearchBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  background: ${(p) => p.theme.accent};
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; }
`;

const ApiStatus = styled.div`
  font-size: 13px;
  color: ${s("textTertiary")};
  margin-top: 8px;
`;

const ApiError = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.danger};
  padding: 12px 16px;
  text-align: center;
  background: ${(p) => p.theme.danger}08;
  border: 1px solid ${(p) => p.theme.danger}20;
  border-radius: 6px;
  margin-top: 8px;
`;

const ApiResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 500px;
  overflow-y: auto;
`;

const ApiResultCard = styled.div<{ $sop?: boolean }>`
  border: 1px solid ${(p) => (p.$sop ? "#b4530930" : p.theme.divider)};
  border-left: 3px solid ${(p) => (p.$sop ? "#b45309" : p.theme.accent)};
  border-radius: 8px;
  padding: 12px 14px;
  background: ${(p) => (p.$sop ? "#fffbeb20" : "transparent")};
`;

const ApiResultRef = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${s("text")};
  margin-bottom: 4px;
`;

const ApiResultBook = styled.div`
  font-size: 12px;
  color: #b45309;
  font-weight: 500;
  margin-bottom: 4px;
`;

const ApiResultText = styled.div`
  font-size: 13px;
  line-height: 1.5;
  color: ${s("textSecondary")};
  margin-bottom: 8px;
`;

const SaveBtn = styled.button`
  border: 1px solid ${s("divider")};
  background: transparent;
  color: ${(p) => p.theme.accent};
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: ${(p) => p.theme.accent}10;
    border-color: ${(p) => p.theme.accent};
  }
`;

/* EGW browser */

const EgwBrowserSection = styled.div`
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid ${s("divider")};
`;

const EgwBrowserTitle = styled.h4`
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: ${s("text")};
`;

const EgwBookGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
  gap: 8px;
  margin-top: 10px;
  max-height: 300px;
  overflow-y: auto;
`;

const EgwBookCard = styled.button<{ $active: boolean }>`
  text-align: left;
  border: 1px solid ${(p) => (p.$active ? "#b45309" : p.theme.divider)};
  background: ${(p) => (p.$active ? "#b4530910" : "transparent")};
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  &:hover { border-color: #b45309; }
`;

const EgwBookTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${s("text")};
`;

const EgwBookAbbr = styled.div`
  font-size: 11px;
  color: ${s("textTertiary")};
`;

const EgwTocSection = styled.div`
  margin-top: 16px;
`;

const EgwTocList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
`;

const EgwTocItem = styled.button<{ $level: number }>`
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  border-bottom: 1px solid ${s("divider")};
  background: transparent;
  padding: 8px 12px 8px ${(p) => 12 + p.$level * 16}px;
  font-size: 13px;
  color: ${s("text")};
  cursor: pointer;
  &:hover { background: ${s("secondaryBackground")}; }
  &:last-child { border-bottom: none; }
`;

const EgwContentSection = styled.div`
  margin-top: 16px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
  background: ${s("secondaryBackground")};
`;

const EgwPara = styled.div`
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.7;
  color: ${s("text")};
  display: flex;
  gap: 8px;
  align-items: flex-start;

  & > span {
    flex: 1;
  }

  & > ${SaveBtn} {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const EgwRefcode = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
  flex-shrink: 0;
  min-width: 60px;
`;

export default observer(BibleExplorer);
