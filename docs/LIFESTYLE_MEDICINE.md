# Lifestyle Medicine 2.0 — Developer Reference

> Standalone reference for debugging and extending the medical knowledge platform.
> No AI assistance needed — everything you need is in this document.

---

## Table of Contents

1. [What This Project Is](#what-this-project-is)
2. [How Data Flows](#how-data-flows)
3. [The Registration Checklist](#the-registration-checklist)
4. [Custom Data Models](#custom-data-models)
5. [API Endpoints](#api-endpoints)
6. [Frontend Stores & Models](#frontend-stores--models)
7. [UI Scenes & Components](#ui-scenes--components)
8. [AI Content Generation](#ai-content-generation)
9. [Editor Blocks](#editor-blocks)
10. [Team Preferences (The 3-File Rule)](#team-preferences-the-3-file-rule)
11. [Settings Pages](#settings-pages)
12. [Common Debugging Scenarios](#common-debugging-scenarios)
13. [File Index](#file-index)

---

## What This Project Is

Outline (collaborative wiki) forked into a medical knowledge platform. Doctors
collaboratively author structured treatment guides for 1000+ medical conditions.

Each **Condition** (e.g. "Type 2 Diabetes") has 6 **Sections**:

| Section Type     | Purpose                                          |
|------------------|--------------------------------------------------|
| `risk_factors`   | Risk factors and predispositions                 |
| `physiology`     | Underlying physiology and pathophysiology        |
| `complications`  | Complications and comorbidities                  |
| `solutions`      | Interventions organized by NEWSTART+ care domains|
| `bible_sop`      | Scripture + Spirit of Prophecy references        |
| `research_ideas` | Research gaps and study ideas                    |

Each section links to an **Outline Document** (`documentId`), so the
collaborative rich-text editor (Y.js + Prosemirror) works per-section.

**Brand colors:** Crimson `#e63950`, Slate Blue `#486581` / `#102a43`

---

## How Data Flows

### Creating a Condition

```
User clicks "Create Condition"
    │
    ▼
Frontend: ConditionsStore.create({ name, snomedCode, icdCode })
    │  POST /api/conditions.create
    ▼
Server Route: server/routes/api/conditions/conditions.ts
    │  Validates with Zod schema, checks policy
    ▼
Command: server/commands/conditionCreator.ts
    │
    ├─► Creates a Collection (if none provided)
    │     name = condition name, icon = "kit-medical"
    │
    ├─► Creates the Condition record
    │     status = "draft", slug = slugify(name)
    │
    └─► Creates 6 ConditionSections, each with:
          ├─► A backing Document (via documentCreator command)
          └─► A ConditionSection record linking to that Document
```

### Opening a Section for Editing

```
User clicks "Open Editor" on a SectionPanel
    │
    ▼
SectionPanel reads section.documentId
    │  history.push(document.path)
    ▼
Navigates to Outline's standard Document editor
    │  Y.js collaborative editing, version history, comments
    │  — all work automatically because it's a real Document
    ▼
User edits content collaboratively in real-time
```

### Generating AI Content

```
User clicks "Generate with AI" on a SectionPanel
    │
    ▼
AIGenerateButton: POST /api/ai.generateContent
    │  { conditionName, sectionType, existingContent }
    ▼
Server Route: server/routes/api/ai/ai.ts
    │  Reads team's preferred model from TeamPreference.AIModel
    │  Builds prompt via GeminiService.buildPromptPublic()
    ▼
AIService.generate(modelId, { prompt })
    │  Dispatches to correct provider:
    ├─► GeminiService.generateRaw()    (gemini-2.0-flash)
    ├─► OpenAIService.generate()       (gpt-5.2)
    └─► AnthropicService.generate()    (claude-sonnet-4-6)
    │
    ▼
Response: markdown string
    │
    ▼
SectionPanel renders preview via MarkdownIt
    │  User can "Copy & Edit" (copies to clipboard, opens document)
    │  or "Dismiss"
```

---

## The Registration Checklist

When adding a new entity (e.g. a new model), you must register it in multiple
places. Missing any one causes silent failures.

### Adding a New Server Model

| Step | File | What to Do |
|------|------|------------|
| 1 | `server/migrations/` | Create migration file |
| 2 | `server/models/YourModel.ts` | Create model class extending `IdModel` or `ParanoidModel` |
| 3 | `server/models/index.ts` | Add `export { default as YourModel } from "./YourModel"` |
| 4 | `server/policies/yourModel.ts` | Create policy file with `allow()` rules |
| 5 | `server/policies/index.ts` | Add `import "./yourModel"` (side-effect import) |
| 6 | `server/presenters/yourModel.ts` | Create presenter function |
| 7 | `server/presenters/index.ts` | Import and re-export the presenter |
| 8 | `server/routes/api/yourModels/` | Create route file + `schema.ts` |
| 9 | `server/routes/api/index.ts` | Import and mount: `router.use("/", route.routes())` |

### Adding a New Frontend Store

| Step | File | What to Do |
|------|------|------------|
| 1 | `app/models/YourModel.ts` | Create model with `@Field`, `@observable`, `@Relation` |
| 2 | `app/stores/YourModelsStore.ts` | Create store extending `Store<YourModel>` |
| 3 | `app/stores/RootStore.ts` | Import store, add property, call `registerStore()` in constructor |

### Adding a New Route/Scene

| Step | File | What to Do |
|------|------|------------|
| 1 | `app/scenes/YourScene/index.tsx` | Create the scene component |
| 2 | `app/utils/routeHelpers.ts` | Add path helper function |
| 3 | `app/routes/authenticated.tsx` | Add lazy import + `<Route>` entry |

---

## Custom Data Models

### Database Schema

```
conditions
├── id (UUID PK)
├── name, slug
├── snomedCode, icdCode (optional)
├── status: "draft" | "review" | "published"
├── overviewDocumentId → documents.id
├── collectionId → collections.id
├── teamId → teams.id
├── createdById → users.id
└── deletedAt (soft delete)

condition_sections
├── id (UUID PK)
├── conditionId → conditions.id (CASCADE)
├── sectionType: risk_factors|physiology|complications|solutions|bible_sop|research_ideas
├── documentId → documents.id  ◄── THIS IS THE KEY LINK
├── careDomainId → care_domains.id (optional)
├── sortOrder
└── title

care_domains
├── id (UUID PK)
├── name, slug (UNIQUE)
├── description, icon, color
└── sortOrder

interventions
├── id (UUID PK)
├── name, slug, category, description
├── documentId → documents.id
├── teamId, createdById
└── deletedAt (soft delete)

condition_interventions  (junction)
├── conditionId → conditions.id
├── interventionId → interventions.id
├── careDomainId → care_domains.id
├── evidenceLevel
└── UNIQUE(conditionId, interventionId)

evidence_entries
├── id (UUID PK)
├── conditionId, interventionId (optional FKs)
├── pubmedId, doi, title, authors, journal
├── publicationDate, abstract, url, evidenceLevel
└── teamId, createdById

scriptures
├── id (UUID PK)
├── reference, text, book, chapter, verseStart, verseEnd
├── translation (default "KJV")
├── spiritOfProphecy (boolean)
├── sopSource
├── conditionId, interventionId (optional FKs)
└── teamId

recipes
├── id (UUID PK)
├── name, slug, description
├── servings, prepTime, cookTime
├── ingredients (JSONB), instructions (JSONB), nutritionData (JSONB)
├── documentId → documents.id
├── teamId, createdById
└── deletedAt (soft delete)

condition_recipes  (junction)
├── conditionId → conditions.id
├── recipeId → recipes.id
├── careDomainId → care_domains.id
└── UNIQUE(conditionId, recipeId)

medical_references
├── id (UUID PK)
├── sourceType: snomed|icd|fhir|clinicaltrials
├── sourceId, sourceData (JSONB)
├── conditionId, interventionId (optional FKs)
└── teamId
```

### Model Files

| Model | File | Base Class | Soft Delete? |
|-------|------|-----------|-------------|
| CareDomain | `server/models/CareDomain.ts` | IdModel | No |
| Condition | `server/models/Condition.ts` | ParanoidModel | Yes |
| ConditionSection | `server/models/ConditionSection.ts` | IdModel | No |
| Intervention | `server/models/Intervention.ts` | ParanoidModel | Yes |
| ConditionIntervention | `server/models/ConditionIntervention.ts` | IdModel | No |
| EvidenceEntry | `server/models/EvidenceEntry.ts` | IdModel | No |
| MedicalReference | `server/models/MedicalReference.ts` | IdModel | No |
| Scripture | `server/models/Scripture.ts` | IdModel | No |
| Recipe | `server/models/Recipe.ts` | ParanoidModel | Yes |
| ConditionRecipe | `server/models/ConditionRecipe.ts` | IdModel | No |

---

## API Endpoints

### Conditions

| Endpoint | Method | Input | Description |
|----------|--------|-------|-------------|
| `conditions.list` | POST | `{ status?, offset, limit }` | Paginated list with optional status filter |
| `conditions.info` | POST | `{ id }` | Single condition with sections included |
| `conditions.create` | POST | `{ name, snomedCode?, icdCode?, collectionId? }` | Creates condition + 6 sections + documents |
| `conditions.update` | POST | `{ id, name?, snomedCode?, icdCode? }` | Update (auto-regenerates slug) |
| `conditions.status` | POST | `{ id, status }` | Change status (draft/review/published) |

### Condition Sections

| Endpoint | Method | Input | Description |
|----------|--------|-------|-------------|
| `conditionSections.list` | POST | `{ conditionId }` | List sections ordered by sortOrder |
| `conditionSections.createDocument` | POST | `{ id }` | Create backing document for a section |

### Interventions

| Endpoint | Method | Input | Description |
|----------|--------|-------|-------------|
| `interventions.list` | POST | `{ offset, limit }` | Paginated list |
| `interventions.info` | POST | `{ id }` | Single intervention |
| `interventions.create` | POST | `{ name, category?, description? }` | Create intervention |
| `interventions.update` | POST | `{ id, name?, ... }` | Update intervention |
| `interventions.delete` | POST | `{ id }` | Soft delete |

### AI

| Endpoint | Method | Input | Description |
|----------|--------|-------|-------------|
| `ai.models` | POST | `{}` | Returns available AI models (based on configured API keys) |
| `ai.generateContent` | POST | `{ conditionName, sectionType, existingContent?, additionalContext? }` | Generate section content |
| `ai.suggest` | POST | `{ conditionName, sectionType, existingData }` | Suggest related content |
| `ai.explain` | POST | `{ topic, context? }` | General medical explanation |
| `ai.reviewSummary` | POST | `{ conditionName, sectionSummaries }` | Review condition completeness |
| `ai.search` | POST | `{ query }` | Search across all medical entities |

### Other Medical Endpoints

- `conditionInterventions.create/delete/update` — Link/unlink interventions
- `evidenceEntries.list/create/update/delete` — Manage citations
- `scriptures.list/create/update/delete` — Manage scripture references
- `recipes.list/info/create/update/delete` — Manage recipes
- `careDomains.list` — List NEWSTART+ care domains
- `medical.snomed.search` — Search SNOMED CT codes
- `medical.pubmed.search/import` — Search and import PubMed articles
- `medical.clinicalTrials.search` — Search ClinicalTrials.gov
- `medical.bible.search/lookup` — Search Bible references

---

## Frontend Stores & Models

### Store → Model Mapping

| Store | Model | API Prefix |
|-------|-------|------------|
| `ConditionsStore` | `Condition` | `conditions.` |
| `ConditionSectionsStore` | `ConditionSection` | `conditionSections.` |
| `CareDomainsStore` | `CareDomain` | `careDomains.` |
| `InterventionsStore` | `Intervention` | `interventions.` |
| `EvidenceEntriesStore` | `EvidenceEntry` | `evidenceEntries.` |
| `ScripturesStore` | `Scripture` | `scriptures.` |
| `RecipesStore` | `Recipe` | `recipes.` |

### Accessing Stores in Components

```typescript
import useStores from "~/hooks/useStores";

function MyComponent() {
  const { conditions, interventions, recipes } = useStores();
  // conditions.data → Map of all loaded conditions
  // conditions.fetch(id) → load single condition
  // conditions.fetchPage({ offset, limit }) → paginated list
}
```

---

## UI Scenes & Components

### Route Map

| URL Path | Scene | File |
|----------|-------|------|
| `/conditions` | Conditions list | `app/scenes/Conditions/index.tsx` |
| `/conditions/:id` | Condition editor | `app/scenes/ConditionEditor/index.tsx` |
| `/conditions/:id/compiled` | Compiled view | `app/scenes/ConditionCompiled/index.tsx` |
| `/interventions` | Interventions list | `app/scenes/Interventions/index.tsx` |
| `/recipes` | Recipes grid | `app/scenes/Recipes/index.tsx` |
| `/knowledge-graph` | Knowledge graph | `app/scenes/KnowledgeGraph/index.tsx` |
| `/analytics` | Analytics dashboard | `app/scenes/Analytics/index.tsx` |
| `/search` | Medical search | `app/scenes/Search/Search.tsx` |

Path helpers defined in `app/utils/routeHelpers.ts`.

### Condition Editor Component Tree

```
ConditionEditor/index.tsx
├── ConditionHeader.tsx        — Title, SNOMED badge, status badge
├── SectionPanel.tsx (×6)      — One per section type
│   ├── Document preview       — Shows linked document title
│   ├── "Open Editor" button   — Navigates to document's collaborative editor
│   ├── AIGenerateButton       — Triggers AI content generation
│   └── AI Preview Area        — MarkdownIt-rendered preview with Copy/Dismiss
└── MetadataPanel.tsx          — Right sidebar: interventions, scriptures, recipes
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `SectionPanel` | `app/scenes/ConditionEditor/components/SectionPanel.tsx` | Collapsible section with doc preview + AI |
| `AIGenerateButton` | `app/components/medical/AIGenerateButton.tsx` | Triggers AI generation for a section |
| `CareDomainBadge` | `app/components/CareDomainBadge.tsx` | Colored badge for care domains |
| `StatusBadge` | `app/components/StatusBadge.tsx` | Draft/review/published indicator |

---

## AI Content Generation

### Architecture

```
AIService (dispatcher)
├── GeminiService    — env.GEMINI_API_KEY    → Gemini 2.0 Flash
├── OpenAIService    — env.OPENAI_API_KEY    → GPT-5.2
└── AnthropicService — env.ANTHROPIC_API_KEY → Claude Sonnet 4.6
```

### Files

| File | Purpose |
|------|---------|
| `server/services/ai/AIService.ts` | Dispatcher: routes to provider by model ID |
| `server/services/ai/GeminiService.ts` | Gemini API + all prompt builder methods |
| `server/services/ai/OpenAIService.ts` | OpenAI chat completions API |
| `server/services/ai/AnthropicService.ts` | Anthropic messages API |
| `server/routes/api/ai/ai.ts` | AI route handlers |

### Model Selection

The team's preferred model is stored in `TeamPreference.AIModel`.
Default: `"gemini-2.0-flash"`. Configurable in Settings > Features.

Only models with configured API keys appear in the dropdown.
`AIService.getAvailableModels()` checks which env vars are set.

### Prompt Builders

All prompts are static methods on `GeminiService` (reused across providers):

| Method | Used By |
|--------|---------|
| `buildPromptPublic(opts)` | `ai.generateContent` endpoint |
| `buildSuggestPrompt(condition, section, data)` | `ai.suggest` endpoint |
| `buildExplainPrompt(topic, context?)` | `ai.explain` endpoint |
| `buildReviewPrompt(condition, summaries)` | `ai.reviewSummary` endpoint |

### Environment Variables

```env
GEMINI_API_KEY=your-key       # Required for Gemini provider
OPENAI_API_KEY=your-key       # Optional, enables OpenAI provider
ANTHROPIC_API_KEY=your-key    # Optional, enables Anthropic provider
```

Defined in `server/env.ts`.

---

## Editor Blocks

### Custom Medical Blocks

Three custom blocks added to the slash command (`/`) menu:

| Block ID | Label | Purpose |
|----------|-------|---------|
| `bible` | Bible verse | Insert Bible verse reference |
| `egw` | Spirit of Prophecy | Insert Ellen G. White quotation |
| `ai` | AI explanation | Insert AI-generated explanation |

### How Block Toggle Works

1. Block items defined in `app/editor/menus/block.tsx`
2. Stable IDs exported from `app/editor/components/BlockMenu.tsx` as `MEDICAL_BLOCK_ITEMS`
3. Disabled block IDs stored in `TeamPreference.DisabledMedicalBlocks` (string array)
4. `BlockMenu.tsx` reads the preference and filters out disabled items
5. Toggle UI in Settings > Embeds (`app/scenes/Settings/Embeds.tsx`)

### Adding a New Medical Block

1. Add the block definition to `app/editor/menus/block.tsx`
2. Add its stable ID to `MEDICAL_BLOCK_ITEMS` in `app/editor/components/BlockMenu.tsx`
3. No other registration needed — the toggle will appear automatically in Settings

---

## Team Preferences (The 3-File Rule)

**This is the #1 source of bugs.** Adding a team preference requires changes
in ALL THREE files, or the value gets silently stripped during save.

### The Three Files

**File 1: `shared/types.ts`** — Enum + Type

```typescript
// Add to TeamPreference enum:
export enum TeamPreference {
  // ... existing ...
  YourPref = "yourPref",
}

// Add to TeamPreferences type:
export type TeamPreferences = {
  // ... existing ...
  [TeamPreference.YourPref]?: boolean; // or string, string[], etc.
};
```

**File 2: `shared/constants.ts`** — Default value

```typescript
export const TeamPreferenceDefaults: TeamPreferences = {
  // ... existing ...
  [TeamPreference.YourPref]: false, // your default
};
```

**File 3: `server/routes/api/teams/schema.ts`** — Zod validation

```typescript
preferences: z.object({
  // ... existing ...
  yourPref: z.boolean().optional(),  // MUST match the key name exactly
}).optional(),
```

### Current Custom Preferences

| Preference | Key | Type | Default | Purpose |
|------------|-----|------|---------|---------|
| DisabledMedicalBlocks | `disabledMedicalBlocks` | `string[]` | `[]` | IDs of disabled editor blocks |
| AIModel | `aiModel` | `string` | `"gemini-2.0-flash"` | Team's preferred AI model |

### How Preferences Save

```
Frontend: team.setPreference(key, value)
    │  team.save({ preferences: {...team.preferences} })
    ▼
POST /api/teams.update  { preferences: { ... } }
    │
    ▼
Zod schema validation (server/routes/api/teams/schema.ts)
    │  ⚠️  Unknown keys are STRIPPED here!
    │  If your key isn't in the schema, the value disappears.
    ▼
Saved to teams.preferences (JSONB column)
```

---

## Settings Pages

### How Settings Work

All settings pages are declared in `app/hooks/useSettingsConfig.ts`.
The sidebar and routes are auto-generated from this config.

### Adding a New Settings Page

```typescript
// In useSettingsConfig.ts:

const YourPage = lazy(() => import("~/scenes/Settings/YourPage"));

// Add to the config array:
{
  name: t("Your Page"),
  path: settingsPath("your-page"),
  component: YourPage.Component,
  preload: YourPage.preload,
  enabled: can.update,       // policy check
  group: t("Workspace"),     // sidebar section
  icon: YourIcon,
},
```

### Current Custom Settings Pages

| Page | Path | Group | File |
|------|------|-------|------|
| AI | `/settings/ai` | Workspace | `app/scenes/Settings/Features.tsx` |
| Embeds | `/settings/embeds` | Workspace | `app/scenes/Settings/Embeds.tsx` |

---

## Common Debugging Scenarios

### "My new preference isn't saving"

1. Check `server/routes/api/teams/schema.ts` — is the key in the Zod schema?
2. Check `shared/types.ts` — is it in the `TeamPreference` enum and `TeamPreferences` type?
3. Check `shared/constants.ts` — does it have a default in `TeamPreferenceDefaults`?
4. All three must match. See [The 3-File Rule](#team-preferences-the-3-file-rule).

### "My new API endpoint returns 404"

1. Check `server/routes/api/index.ts` — is the route file imported and mounted?
2. Check the route file — is the handler exported correctly?
3. Check Zod schema — does validation pass? Invalid input returns 400, not 404.

### "My new model isn't available in routes"

1. Check `server/models/index.ts` — is it exported?
2. Check the migration — has it been run? (`yarn db:migrate`)
3. Check associations — are `BelongsTo`/`HasMany` decorators correct?

### "My new store is undefined in components"

1. Check `app/stores/RootStore.ts`:
   - Is the store imported?
   - Is the property declared on the class?
   - Is `registerStore()` called in the constructor?
2. Check `useStores()` destructuring — does the key match the property name?

### "Condition sections have no document / editor doesn't open"

The section's `documentId` is null. This means the backing document hasn't been
created yet. The user needs to click "Create Document" in the SectionPanel,
which calls `conditionSections.createDocument`.

Alternatively, check `server/commands/conditionCreator.ts` — new conditions
should auto-create backing documents for all 6 sections.

### "AI generation fails"

1. Check the API key env var (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
2. Check the team's `aiModel` preference matches a configured provider
3. Check `server/routes/api/ai/ai.ts` for error handling — failures return 502
4. Check `server/services/ai/AIService.ts` — is the model ID in `AI_MODELS`?

### "New editor block doesn't show in slash menu"

1. Check `app/editor/menus/block.tsx` — is the item in the array?
2. Check `app/editor/components/BlockMenu.tsx` — is it being filtered out by `DisabledMedicalBlocks`?
3. Check team preferences — is the block ID in the disabled list?

### "Settings page doesn't appear in sidebar"

1. Check `app/hooks/useSettingsConfig.ts` — is the config entry present?
2. Check `enabled` — does the policy check pass for the current user?
3. Check the lazy import — does the component file exist and export default?

---

## File Index

### Server — Models
```
server/models/CareDomain.ts
server/models/Condition.ts
server/models/ConditionSection.ts
server/models/Intervention.ts
server/models/ConditionIntervention.ts
server/models/EvidenceEntry.ts
server/models/MedicalReference.ts
server/models/Scripture.ts
server/models/Recipe.ts
server/models/ConditionRecipe.ts
server/models/index.ts                    ◄ Registration
```

### Server — Commands
```
server/commands/conditionCreator.ts       ◄ Creates condition + sections + documents
server/commands/conditionSectionCreator.ts
```

### Server — Routes
```
server/routes/api/conditions/conditions.ts
server/routes/api/conditions/schema.ts
server/routes/api/conditionSections/conditionSections.ts
server/routes/api/conditionSections/schema.ts
server/routes/api/interventions/interventions.ts
server/routes/api/conditionInterventions/conditionInterventions.ts
server/routes/api/evidenceEntries/evidenceEntries.ts
server/routes/api/scriptures/scriptures.ts
server/routes/api/recipes/recipes.ts
server/routes/api/careDomains/careDomains.ts
server/routes/api/ai/ai.ts
server/routes/api/ai/schema.ts
server/routes/api/medical/medical.ts
server/routes/api/analytics/analytics.ts
server/routes/api/fhir/fhir.ts
server/routes/api/index.ts                ◄ Registration
```

### Server — Policies & Presenters
```
server/policies/condition.ts
server/policies/intervention.ts
server/policies/evidenceEntry.ts
server/policies/scripture.ts
server/policies/recipe.ts
server/policies/careDomain.ts
server/policies/index.ts                   ◄ Registration

server/presenters/condition.ts
server/presenters/conditionSection.ts
server/presenters/intervention.ts
server/presenters/conditionIntervention.ts
server/presenters/evidenceEntry.ts
server/presenters/scripture.ts
server/presenters/recipe.ts
server/presenters/careDomain.ts
server/presenters/index.ts                 ◄ Registration
```

### Server — AI Services
```
server/services/ai/AIService.ts            ◄ Dispatcher
server/services/ai/GeminiService.ts        ◄ Gemini + prompt builders
server/services/ai/OpenAIService.ts
server/services/ai/AnthropicService.ts
```

### Server — Medical Services
```
server/services/medical/SnomedService.ts
server/services/medical/PubMedService.ts
server/services/medical/ClinicalTrialsService.ts
server/services/medical/BibleService.ts
```

### Frontend — Models & Stores
```
app/models/Condition.ts
app/models/ConditionSection.ts
app/models/CareDomain.ts
app/models/Intervention.ts
app/models/EvidenceEntry.ts
app/models/Scripture.ts
app/models/Recipe.ts

app/stores/ConditionsStore.ts
app/stores/ConditionSectionsStore.ts
app/stores/CareDomainsStore.ts
app/stores/InterventionsStore.ts
app/stores/EvidenceEntriesStore.ts
app/stores/ScripturesStore.ts
app/stores/RecipesStore.ts
app/stores/RootStore.ts                    ◄ Registration
```

### Frontend — Scenes
```
app/scenes/ConditionEditor/index.tsx
app/scenes/ConditionEditor/components/ConditionHeader.tsx
app/scenes/ConditionEditor/components/SectionPanel.tsx
app/scenes/ConditionEditor/components/MetadataPanel.tsx
app/scenes/Conditions/index.tsx
app/scenes/ConditionCompiled/index.tsx
app/scenes/Interventions/index.tsx
app/scenes/Recipes/index.tsx
app/scenes/KnowledgeGraph/index.tsx
app/scenes/Analytics/index.tsx
app/scenes/Search/Search.tsx
app/scenes/Settings/Features.tsx           ◄ AI model selector
app/scenes/Settings/Embeds.tsx             ◄ Block toggles
```

### Frontend — Routing & Config
```
app/routes/authenticated.tsx               ◄ Route registration
app/utils/routeHelpers.ts                  ◄ Path helper functions
app/hooks/useSettingsConfig.ts             ◄ Settings page registration
```

### Frontend — Medical Components
```
app/components/medical/AIGenerateButton.tsx
app/editor/menus/block.tsx                 ◄ Block menu items
app/editor/components/BlockMenu.tsx        ◄ MEDICAL_BLOCK_ITEMS + filtering
```

### Shared
```
shared/types.ts                            ◄ TeamPreference enum
shared/constants.ts                        ◄ TeamPreferenceDefaults
server/routes/api/teams/schema.ts          ◄ Zod preference validation
server/env.ts                              ◄ Environment variable definitions
```
