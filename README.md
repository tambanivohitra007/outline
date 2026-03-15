<p align="center">
  <img src="./public/images/lifestyle.png" height="64" alt="Lifestyle Medicine 2.0" />
</p>
<p align="center">
  <strong>Lifestyle Medicine 2.0</strong><br/>
  <i>A collaborative medical knowledge platform for authoring condition treatment guides, built on <a href="https://github.com/outline/outline">Outline</a>.</i>
</p>
<p align="center">
  <a href="http://www.typescriptlang.org" rel="nofollow"><img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg" alt="TypeScript"></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat" alt="Prettier"></a>
  <a href="https://github.com/styled-components/styled-components"><img src="https://img.shields.io/badge/style-%F0%9F%92%85%20styled--components-orange.svg" alt="Styled Components"></a>
</p>

---

Lifestyle Medicine 2.0 is a fork of [Outline](https://github.com/outline/outline) customized for medical teams who collaboratively author structured treatment guides for health conditions. It combines Outline's real-time collaborative editing with structured medical data models, external API integrations, and a NEWSTART+ lifestyle medicine framework.

## What's Different from Outline

This fork adds the following on top of Outline's collaborative knowledge base:

### Structured Condition Editing

- **Conditions** with SNOMED/ICD codes, status tracking (draft / review / published), and structured sections (Risk Factors, Physiology, Complications, Solutions, Bible & SoP, Research Ideas)
- **Interventions** linked to conditions with evidence levels, recommendation grades, and care domain classification
- **Recipes** with nutritional data and condition associations
- **Evidence entries** with PubMed IDs, DOIs, study types, quality ratings, and abstracts
- **Scripture references** for Bible verses and Spirit of Prophecy (Ellen G. White) quotes, linked to conditions and care domains

### Medical API Integrations

- **API.Bible** — Search and retrieve Bible verses and full chapters by reference or keyword
- **EGW Writings API** — Search Ellen G. White writings, browse books, and fetch passages
- **Gemini AI** — Generate medical content, explanations, review summaries, and section suggestions using Google Gemini
- **FHIR R4** — Export conditions and care plans in HL7 FHIR format for EHR interoperability
- **Cerbo EHR** — Patient portal integration

### New Scenes & Features

- **Knowledge Graph** — Interactive mind-map visualization of conditions, interventions, and their relationships using markmap
- **Analytics Dashboard** — Condition completeness, evidence coverage, and content metrics
- **Bible Explorer** — Search, browse, and save Bible verses and Spirit of Prophecy quotes to your collection
- **Condition Editor** — Structured section editor with drag-and-drop ordering, AI content generation, and review summaries
- **Compiled Document View** — Assemble all sections, interventions, evidence, and scriptures into a single printable/exportable document
- **Patient Portal** — Patient-facing view integrated with Cerbo EHR
- **Editor Slash Commands** — Insert Bible verses, EGW quotes, and AI explanations directly into documents via the `/` menu

### Other Additions

- **Local authentication** plugin with email/password sign-in and registration
- **Care domains** for organizing interventions (Nutrition, Exercise, Water Therapy, Sunlight, Temperance, Air, Rest, Trust in God, Supplements, Medications)
- **Team preferences** for toggling medical block items in the editor
- **Settings page** for managing medical block visibility

## Architecture

This project follows Outline's monorepo structure. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the base layout.

### Medical Extensions

```
server/
  models/
    Condition.ts              # Treatment guide with SNOMED/ICD codes
    ConditionSection.ts       # Sections linked to Documents for content
    ConditionIntervention.ts  # Condition-intervention join with evidence levels
    ConditionRecipe.ts        # Condition-recipe associations
    Intervention.ts           # Treatments and therapies
    Recipe.ts                 # Therapeutic recipes with nutrition data
    EvidenceEntry.ts          # Research citations (PubMed, DOI)
    Scripture.ts              # Bible/SoP references
    CareDomain.ts             # NEWSTART+ care domain categories
  services/
    ai/GeminiService.ts       # Google Gemini API integration
    medical/BibleService.ts   # API.Bible integration
    medical/EgwService.ts     # EGW Writings API integration
    fhir/                     # FHIR R4 export service
  routes/api/
    conditions/               # CRUD + compile endpoint
    interventions/            # CRUD
    recipes/                  # CRUD
    scriptures/               # CRUD with duplicate detection
    medical/                  # Bible & EGW search endpoints
    ai/                       # AI generation, search, explain endpoints

app/
  scenes/
    Conditions.tsx            # Condition list
    ConditionEditor/          # Structured section editor
    ConditionCompiled.tsx     # Full compiled document view
    KnowledgeGraph/           # Mind-map visualization
    Analytics/                # Medical content dashboard
    BibleExplorer.tsx         # Scripture search & collection
    PatientPortal/            # Patient-facing portal
  components/medical/
    BibleSearch.tsx           # Bible verse search component
    ChapterReader.tsx         # Full chapter reading panel
  editor/components/
    MedicalInsertDialog.tsx   # Slash command insert dialog
    BlockMenu.tsx             # Extended with medical block items
```

## Development

### Prerequisites

- Node.js 20+
- Yarn 4
- PostgreSQL 15+
- Redis 7+

### Setup

```bash
# Install dependencies
yarn install

# Copy environment file and configure
cp .env.sample .env

# Required environment variables for medical features:
# BIBLE_API_KEY        — API.Bible key (https://scripture.api.bible)
# EGW_CLIENT_ID        — EGW Writings API client ID
# EGW_CLIENT_SECRET    — EGW Writings API client secret
# GEMINI_API_KEY        — Google Gemini API key

# Run database migrations
yarn db:migrate

# Start development
make up               # Docker containers + SSL
yarn dev:watch        # Backend + frontend concurrently
```

### Commands

```bash
yarn dev:watch              # Full dev environment
yarn build                  # Production build
yarn test path/to/file      # Run specific test
yarn lint                   # Oxlint
yarn tsc                    # Type check
yarn db:migrate             # Run migrations
yarn db:create-migration --name my-migration
```

## Staying Up to Date with Upstream

This fork tracks upstream Outline. To pull in latest changes:

```bash
git fetch upstream
git merge upstream/main
# Resolve any conflicts, then commit
```

Custom files (models, services, scenes) are additive and rarely conflict. Files that modify upstream code (`shared/types.ts`, `app/routes/authenticated.tsx`, `server/routes/api/index.ts`) may require manual conflict resolution.

## License

Outline is [BSL 1.1 licensed](LICENSE). Medical extensions in this fork follow the same license.
