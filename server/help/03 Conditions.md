A **condition** is the central object in the platform. It represents a medical condition (disease, disorder, or health concern) and organizes all related treatment information.

## Condition fields

| Field | Description |
|-------|-------------|
| **Name** | Display name of the condition (e.g., "Hypertension") |
| **Slug** | URL-friendly version of the name, generated automatically |
| **SNOMED Code** | SNOMED CT concept identifier for clinical coding |
| **ICD Code** | ICD-10 or ICD-11 classification code |
| **Description** | Optional free-text description |
| **Status** | Current lifecycle stage: Draft, Review, or Published |
| **Collection** | The Outline collection that holds all section documents |

## Creating a condition

Navigate to the conditions list and click **New Condition**. The minimum required field is the condition name. See the "Getting Started" guide for a full walkthrough.

When a condition is created, the system automatically provisions:

- A **dedicated collection** (unless you specify an existing one)
- **Six section documents** in draft state, one for each default section type
- The condition starts in **Draft** status

## Editing a condition

Open a condition from the list to access the condition editor. The editor has:

- **Header** \u2014 condition name, status badge, and action buttons
- **Metadata panel** \u2014 SNOMED code, ICD code, and description
- **Sections tab** \u2014 the six content sections with document previews
- **Interventions tab** \u2014 linked therapeutic interventions
- **Evidence tab** \u2014 PubMed studies and clinical trial references
- **Scripture tab** \u2014 Bible verses and Spirit of Prophecy quotations

## Condition status

Every condition has one of three statuses:

| Status | Meaning | Document visibility |
|--------|---------|-------------------|
| **Draft** | Work in progress | Section documents are **private** \u2014 only visible in the condition editor, not in collections |
| **Review** | Submitted for team review | Section documents are **published** into the collection and visible to all team members |
| **Published** | Finalized treatment guide | Same as Review \u2014 documents remain published in the collection |

See the "Collaboration Workflow" guide for details on how status transitions work.

## Deleting a condition

Deleting a condition permanently removes:

- All section documents linked to the condition
- The dedicated collection (only if it contains no other documents)
- All condition-intervention links

This action cannot be undone. Evidence entries, scriptures, and standalone interventions are **not** deleted.

## Compiling a condition

The **Compile** view generates a read-only summary of the entire condition, pulling together all sections, interventions, evidence, and scriptures into a single page. This is useful for review meetings or printing.

## Repairing a condition

If section documents are out of sync (e.g., they exist but don\u2019t appear in the collection), use the **Repair** action from the condition menu. This re-publishes all section documents and ensures they are properly added to the collection structure.
