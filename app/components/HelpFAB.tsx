import { observer } from "mobx-react";
import MarkdownIt from "markdown-it";
import {
  QuestionMarkIcon,
  CloseIcon,
  BackIcon,
  HomeIcon,
  LightningIcon,
  BeakerIcon,
  DocumentIcon,
  ToolsIcon,
  BookmarkedIcon,
  ShuffleIcon,
  SparklesIcon,
  SettingsIcon,
  LeafIcon,
  ExportIcon,
} from "outline-icons";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { keyframes } from "styled-components";
import { s } from "@shared/styles";

const md = new MarkdownIt({ linkify: true, typographer: true });

interface HelpTopic {
  id: string;
  title: string;
  icon: ReactNode;
  content: string;
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: "welcome",
    title: "Welcome",
    icon: <HomeIcon size={20} />,
    content: `Welcome to the **Lifestyle Medicine** knowledge base \u2014 a collaborative platform for building evidence-based treatment guides using the NEWSTART+ lifestyle medicine framework.

## What you can do here

- **Create treatment guides** for medical conditions, organized into structured sections
- **Link interventions** from the NEWSTART+ care domains (Nutrition, Exercise, Water, Sunlight, Temperance, Air, Rest, Trust in God)
- **Attach evidence** from PubMed and clinical trials
- **Reference Scripture and Spirit of Prophecy** quotations
- **Use AI** to generate draft content and review summaries
- **Collaborate** with your team through a draft \u2192 review \u2192 publish workflow
- **Export** conditions in FHIR R4 format`,
  },
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <LightningIcon size={20} />,
    content: `## Creating your first treatment guide

1. **Navigate to Conditions** \u2014 Click **Conditions** in the sidebar
2. **Create a new condition** \u2014 Click **New Condition** and enter:
   - **Name** (required) \u2014 e.g., "Type 2 Diabetes Mellitus"
   - **SNOMED Code** (optional) \u2014 use autocomplete to search
   - **ICD Code** (optional) \u2014 e.g., "E11"
3. **Write section content** \u2014 Each condition has 6 sections. Click **Open Editor** to write content, or use **AI Generate** for a starting draft
4. **Add interventions** \u2014 Switch to the Interventions tab to link NEWSTART+ treatments
5. **Add evidence** \u2014 Search PubMed or add studies manually
6. **Add scriptures** \u2014 Search Bible or Spirit of Prophecy references
7. **Submit for review** \u2014 Click **Submit for Review** to share with your team
8. **Publish** \u2014 After review, click **Publish** to finalize

## What gets created automatically

When you create a condition, the system provisions:
- A **dedicated collection** to hold all documents
- **Six section documents** (Risk Factors, Physiology, Complications, Solutions, Bible & SoP, Research Ideas)
- The condition starts in **Draft** status`,
  },
  {
    id: "conditions",
    title: "Conditions",
    icon: <BeakerIcon size={20} />,
    content: `## What is a condition?

A condition represents a medical condition (disease, disorder, or health concern) and organizes all related treatment information.

## Condition fields

| Field | Description |
|-------|-------------|
| **Name** | Display name (e.g., "Hypertension") |
| **SNOMED Code** | SNOMED CT concept identifier |
| **ICD Code** | ICD-10/ICD-11 classification code |
| **Description** | Optional free-text description |
| **Status** | Draft, Review, or Published |

## Editing a condition

The condition editor has:
- **Header** \u2014 name, status badge, action buttons
- **Metadata panel** \u2014 SNOMED/ICD codes, description
- **Sections tab** \u2014 six content sections with document previews
- **Interventions tab** \u2014 linked therapeutic interventions
- **Evidence tab** \u2014 PubMed studies and clinical trials
- **Scripture tab** \u2014 Bible and Spirit of Prophecy references

## Deleting a condition

Deleting permanently removes all section documents and the dedicated collection (if empty). Evidence entries and standalone interventions are **not** deleted.

## Compiling

The **Compile** view generates a read-only summary pulling together all sections, interventions, evidence, and scriptures.

## Repairing

If documents are out of sync, use **Repair** to re-publish all section documents into the collection.`,
  },
  {
    id: "sections",
    title: "Sections & Documents",
    icon: <DocumentIcon size={20} />,
    content: `## The six default sections

| Section | What to write |
|---------|---------------|
| **Risk Factors/Causes** | Genetic, lifestyle, environmental risk factors |
| **Relevant Physiology** | Pathophysiology, disease mechanisms, biomarkers |
| **Complications** | Comorbidities, progression risks, organ damage |
| **Solutions** | NEWSTART+ lifestyle interventions and protocols |
| **Bible & Spirit of Prophecy** | Scripture and Ellen G. White references |
| **Research Ideas** | Unanswered questions, proposed studies |

## Writing content

Click **Open Editor** on any section to use the full editor with rich text, images, tables, links, and real-time collaboration.

## Document lifecycle

| Condition status | Documents visible in collection? |
|-----------------|--------------------------------|
| **Draft** | No \u2014 only visible in the condition editor |
| **Review** | Yes \u2014 team members can find and read them |
| **Published** | Yes |

## AI-generated content

Each section has an **AI Generate** button:
1. Generates a draft based on condition name and section type
2. Preview appears with formatted content
3. **Copy & Edit** \u2014 copies to clipboard and opens the editor
4. **Dismiss** \u2014 closes without using

Always review and verify AI content before publishing.`,
  },
  {
    id: "interventions",
    title: "Interventions & Care Domains",
    icon: <ToolsIcon size={20} />,
    content: `## Care domains (NEWSTART+)

| Domain | Focus area |
|--------|-----------|
| **Nutrition** | Diet, whole foods, plant-based eating |
| **Exercise** | Physical activity, movement, rehabilitation |
| **Water** | Hydration, hydrotherapy, water treatments |
| **Sunlight** | Light exposure, vitamin D, circadian rhythm |
| **Temperance** | Avoidance of harmful substances, moderation |
| **Air** | Fresh air, breathing exercises |
| **Rest** | Sleep, sabbath rest, stress reduction |
| **Trust in God** | Spiritual health, faith, prayer |

Care domains are managed by administrators.

## Interventions

An intervention is a specific therapeutic action (e.g., "Mediterranean Diet", "Cold Hydrotherapy").

## Linking to conditions

In the condition editor \u2192 Interventions tab \u2192 **Add Intervention**:

| Field | Description |
|-------|-------------|
| **Evidence Level** | Strength of research support |
| **Recommendation Level** | How strongly recommended |
| **Clinical Notes** | Dosing, protocols, contraindications |
| **Sort Order** | Display position (drag to reorder) |

## Permissions

- **All team members** can view, create, edit, and delete interventions
- **Only administrators** can manage care domains`,
  },
  {
    id: "evidence",
    title: "Evidence & References",
    icon: <BookmarkedIcon size={20} />,
    content: `## Evidence entries

Research studies attached to conditions or interventions. Fields include title, PubMed ID, DOI, authors, journal, abstract, study type, quality rating, and sample size.

## Adding evidence

### From PubMed
1. Evidence tab \u2192 **Search PubMed**
2. Enter search terms (e.g., "Mediterranean diet diabetes")
3. Click **Import** on relevant studies

### From ClinicalTrials.gov
1. Click **Search Clinical Trials**
2. Browse and import relevant trials

### Manually
Click **Add Evidence** and fill in citation details.

## Scripture references

Bible verses and Spirit of Prophecy quotations relevant to health principles.

### Searching Bible verses
Scripture tab \u2192 **Search Bible** \u2192 search by reference ("John 3:16") or keyword ("healing")

### Searching Spirit of Prophecy
Scripture tab \u2192 **Search EGW** \u2192 search by topic ("health reform", "temperance")

## In-editor insert tools

When editing any document, use the toolbar to:
- **Insert Bible verse** \u2014 search and embed a formatted quotation
- **Insert EGW quote** \u2014 search and embed Spirit of Prophecy text
- **AI explanation** \u2014 generate and insert a topic explanation`,
  },
  {
    id: "workflow",
    title: "Collaboration Workflow",
    icon: <ShuffleIcon size={20} />,
    content: `## The three stages

\`\`\`
DRAFT  \u2500\u2500\u2500\u2500\u2500\u2500\u2500>  REVIEW  \u2500\u2500\u2500\u2500\u2500\u2500\u2500>  PUBLISHED
        Submit           Publish
        for Review

REVIEW  <\u2500\u2500\u2500\u2500\u2500\u2500  DRAFT    (Back to Draft)
PUBLISHED <\u2500\u2500\u2500\u2500  DRAFT    (Unpublish)
\`\`\`

### Draft
- Content is **private** \u2014 only visible in the condition editor
- Documents do **not** appear in the collection sidebar
- Write and research without pressure

### Review
- All documents are **published** into the collection
- Team members can find, read, and comment on documents
- Condition is flagged as "In Review"

### Published
- Condition is finalized
- Documents remain visible in the collection
- Can be exported in FHIR R4 format

## Status transitions

| Action | What happens |
|--------|-------------|
| **Submit for Review** | Publishes all section documents, adds them to collection tree |
| **Back to Draft** | Unpublishes all documents, removes from collection tree |
| **Publish** | Marks condition as published (documents stay published) |
| **Unpublish** | Same as Back to Draft |

## Visibility by role

| Role | Draft | Review | Published |
|------|-------|--------|-----------|
| Creator | Full access | Full access | Full access |
| Team member | Not visible | Can read in collection | Can read in collection |
| Admin | Can see in list | Full access | Full access |

## Tips

- **Write in Draft** \u2014 use AI to generate starting content
- **Submit for Review** when ready for feedback
- **Use document comments** during review
- **Pull back to Draft** for major rework
- **Publish** when ready for clinical use`,
  },
  {
    id: "ai",
    title: "AI Features",
    icon: <SparklesIcon size={20} />,
    content: `## Available AI models

| Model | Provider | Best for |
|-------|----------|----------|
| **Gemini 2.0 Flash** | Google | Fast generation |
| **GPT-5.2** | OpenAI | Detailed clinical content |
| **Claude Sonnet 4.6** | Anthropic | Nuanced analysis |

The active model is configured by an administrator in team settings.

## Section content generation

Each condition section has an **AI Generate** button that produces content tailored to the condition name and section type.

| Section | AI generates |
|---------|-------------|
| Risk Factors | Known risk factors, epidemiological data |
| Physiology | Pathophysiology, disease mechanisms |
| Complications | Potential complications, comorbidities |
| Solutions | NEWSTART+ lifestyle interventions |
| Bible & SoP | Health principles from Scripture and EGW |
| Research Ideas | Research gaps, proposed study designs |

## AI Review Summary

Click **AI Review** in the condition header to generate a comprehensive analysis covering completeness, gaps, and suggestions.

## In-editor tools

- **Bible verse insert** \u2014 search and embed formatted quotations
- **Spirit of Prophecy insert** \u2014 search and embed EGW texts
- **AI explanation** \u2014 generate and insert topic explanations

## Important notes

- AI content is a **starting point** \u2014 always verify against peer-reviewed sources
- AI may generate inaccurate information \u2014 cross-reference with PubMed
- The AI does not access private team documents or patient data`,
  },
  {
    id: "admin",
    title: "Administration",
    icon: <SettingsIcon size={20} />,
    content: `## Administrator capabilities

Administrators have the **Admin** role and can manage team-wide settings.

## Managing care domains

Care domains (NEWSTART+ pillars) are team-wide and shared across all conditions.

- **All members** can view care domains
- **Only admins** can create, edit, or delete care domains

Each domain has: name, description, icon, color, and sort order.

## AI model configuration

Admins select which AI model the team uses in team settings. Options: Gemini 2.0 Flash, GPT-5.2, Claude Sonnet 4.6.

### Required API keys (server-level)

| Service | Environment Variable |
|---------|---------------------|
| Gemini | \`GOOGLE_AI_API_KEY\` |
| GPT | \`OPENAI_API_KEY\` |
| Claude | \`ANTHROPIC_API_KEY\` |
| Bible API | \`BIBLE_API_KEY\` |

## Permissions summary

| Action | Member | Admin |
|--------|--------|-------|
| View/create/edit conditions | Yes | Yes |
| View care domains | Yes | Yes |
| Manage care domains | No | **Yes** |
| Manage interventions | Yes | Yes |
| Add evidence/scriptures | Yes | Yes |
| Change AI model | No | **Yes** |
| Manage team members | No | **Yes** |
| FHIR export | Yes | Yes |

## Repairing conditions

Use **Repair** from the condition menu to re-sync documents with the collection structure. This is safe \u2014 it does not modify content.`,
  },
  {
    id: "recipes",
    title: "Recipes",
    icon: <LeafIcon size={20} />,
    content: `## What is a recipe?

A therapeutic recipe linked to conditions as part of lifestyle medicine treatment plans.

## Recipe fields

| Field | Description |
|-------|-------------|
| **Name** | Recipe name |
| **Description** | Health benefits and purpose |
| **Servings** | Number of servings |
| **Prep/Cook Time** | Preparation and cooking time |
| **Ingredients** | List with quantities and units |
| **Instructions** | Step-by-step preparation |
| **Dietary Tags** | vegan, gluten-free, raw, whole-food, etc. |
| **Nutrition Data** | Calories, macros, key nutrients per serving |

## Creating a recipe

Navigate to **Recipes** in the sidebar \u2192 **New Recipe** \u2192 fill in details.

## Linking to conditions

Recipes are linked to conditions through condition-recipe associations, specifying the relevant care domain (typically Nutrition).`,
  },
  {
    id: "fhir",
    title: "FHIR Export",
    icon: <ExportIcon size={20} />,
    content: `## What is FHIR?

FHIR (Fast Healthcare Interoperability Resources) is the international standard for exchanging healthcare information electronically.

## What gets exported

- **Single condition** \u2014 FHIR Condition resource with codes, status, and linked interventions as CarePlan activities
- **Bundle** \u2014 Multiple conditions with related CarePlan resources

## FHIR resource mapping

| Platform concept | FHIR resource |
|-----------------|---------------|
| Condition | Condition |
| Intervention | CarePlan.activity |
| Care Domain | CarePlan.category |

## How to export

Open a condition \u2192 click **FHIR Export** in the menu \u2192 choose single or bundle export.

## Limitations

- Evidence and scripture references are not included (no standard FHIR mapping)
- Document text content is not exported \u2014 only structured data
- Uses FHIR R4 (4.0.1)`,
  },
];

/**
 * Floating action button with an embedded help panel.
 * Shows a topic list; clicking a topic renders its markdown content.
 * Fully self-contained with no backend dependency.
 */
function HelpFAB() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<HelpTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) {
      return HELP_TOPICS;
    }
    const q = searchQuery.toLowerCase();
    return HELP_TOPICS.filter(
      (topic) =>
        topic.title.toLowerCase().includes(q) ||
        topic.content.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeHtml = useMemo(
    () => (activeTopic ? md.render(activeTopic.content) : ""),
    [activeTopic]
  );

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        setActiveTopic(null);
        setSearchQuery("");
      }
      return !prev;
    });
  }, []);

  const handleBack = useCallback(() => {
    setActiveTopic(null);
  }, []);

  return (
    <>
      {isOpen && (
        <Panel>
          <PanelHeader>
            {activeTopic ? (
              <>
                <BackButton onClick={handleBack}>
                  <BackIcon size={20} />
                </BackButton>
                <TopicHeaderIcon>{activeTopic.icon}</TopicHeaderIcon>
                <PanelTitle>{activeTopic.title}</PanelTitle>
              </>
            ) : (
              <PanelTitle>{t("Help & Documentation")}</PanelTitle>
            )}
            <CloseButton onClick={handleToggle}>
              <CloseIcon size={18} />
            </CloseButton>
          </PanelHeader>

          {!activeTopic ? (
            <>
              <SearchArea>
                <SearchInput
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("Search help topics\u2026")}
                  autoFocus
                />
              </SearchArea>
              <TopicList>
                {filteredTopics.map((topic) => (
                  <TopicItem
                    key={topic.id}
                    onClick={() => setActiveTopic(topic)}
                  >
                    <TopicIcon>{topic.icon}</TopicIcon>
                    <TopicName>{topic.title}</TopicName>
                    <TopicArrow>{"\u203A"}</TopicArrow>
                  </TopicItem>
                ))}
                {filteredTopics.length === 0 && (
                  <EmptyState>{t("No matching topics found.")}</EmptyState>
                )}
              </TopicList>
            </>
          ) : (
            <ContentArea dangerouslySetInnerHTML={{ __html: activeHtml }} />
          )}
        </Panel>
      )}

      <FABButton
        onClick={handleToggle}
        aria-label={t("Help & Documentation")}
        $isOpen={isOpen}
      >
        {isOpen ? <CloseIcon size={24} /> : <QuestionMarkIcon size={24} />}
      </FABButton>
    </>
  );
}

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Panel = styled.div`
  position: fixed;
  bottom: 84px;
  right: 24px;
  z-index: 201;
  width: 420px;
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 140px);
  background: ${s("background")};
  border: 1px solid ${s("divider")};
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 150ms ease;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid ${s("divider")};
  flex-shrink: 0;
`;

const PanelTitle = styled.h3`
  flex: 1;
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: ${s("text")};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${s("textTertiary")};
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: ${s("backgroundSecondary")};
    color: ${s("text")};
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${s("textTertiary")};
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: ${s("backgroundSecondary")};
    color: ${s("text")};
  }
`;

const SearchArea = styled.div`
  padding: 12px 16px 8px;
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  background: ${s("background")};
  color: ${s("text")};
  outline: none;

  &:focus {
    border-color: ${s("accent")};
  }

  &::placeholder {
    color: ${s("textTertiary")};
  }
`;

const TopicList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 12px;
`;

const TopicItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 100ms ease;

  &:hover {
    background: ${s("backgroundSecondary")};
  }
`;

const TopicIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  flex-shrink: 0;
  color: ${s("textTertiary")};
`;

const TopicHeaderIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${s("textTertiary")};
  flex-shrink: 0;
`;

const TopicName = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: ${s("text")};
`;

const TopicArrow = styled.span`
  font-size: 18px;
  color: ${s("textTertiary")};
  flex-shrink: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
  color: ${s("textTertiary")};
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  font-size: 13px;
  color: ${s("text")};
  line-height: 1.7;

  h1,
  h2,
  h3 {
    margin: 16px 0 8px;
    font-weight: 700;
    color: ${s("text")};
  }

  h1 { font-size: 1.3em; }
  h2 { font-size: 1.1em; }
  h3 { font-size: 1em; }

  p {
    margin: 0 0 10px;
  }

  ul,
  ol {
    margin: 0 0 10px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  strong {
    font-weight: 600;
  }

  code {
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 0.9em;
    background: ${s("codeBackground")};
  }

  pre {
    margin: 8px 0;
    padding: 10px 12px;
    border-radius: 6px;
    background: ${s("codeBackground")};
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.5;

    code {
      padding: 0;
      background: none;
    }
  }

  blockquote {
    margin: 8px 0;
    padding: 4px 12px;
    border-left: 3px solid ${s("accent")};
    color: ${s("textSecondary")};
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 12px;
  }

  th,
  td {
    border: 1px solid ${s("divider")};
    padding: 6px 8px;
    text-align: left;
  }

  th {
    background: ${s("backgroundSecondary")};
    font-weight: 600;
  }

  a {
    color: ${s("accent")};
    text-decoration: underline;
  }
`;

const FABButton = styled.button<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 202;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: ${s("accent")};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 150ms ease, box-shadow 150ms ease;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: scale(0.96);
  }

  @media print {
    display: none;
  }
`;

export default observer(HelpFAB);
