The platform uses a three-stage workflow to support team collaboration on treatment guides. This ensures content is reviewed before being shared widely.

## The three stages

```
  DRAFT  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2192  REVIEW  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2192  PUBLISHED
    \u2502  Submit for Review     \u2502  Publish               \u2502
    \u2502                        \u2502                        \u2502
    \u25c4\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  Back to Draft          \u2502
    \u25c4\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  Unpublish
```

### Draft

- The condition and all its section documents are **private**
- Only the creator (and editors with direct access) can see the content
- Section documents do **not** appear in the collection sidebar
- This is where you do your initial writing and research

### Review

- All section documents are **published** into the condition\u2019s collection
- Team members can now find and read the documents in the collection sidebar
- Team members can leave comments and suggestions on the documents
- The condition is flagged as \u201cIn Review\u201d in the conditions list
- Use this stage to gather feedback before final publication

### Published

- The condition is considered finalized
- All documents remain published and visible in the collection
- The condition can be exported in FHIR R4 format
- The compiled view provides a complete read-only summary

## How to transition status

### Submit for Review (Draft \u2192 Review)

1. Open the condition in the editor
2. Click **Submit for Review** in the header
3. The system automatically:
   - Sets the condition status to "Review"
   - Publishes all section documents (sets `publishedAt`)
   - Adds each document to the collection\u2019s document tree
   - Documents now appear in the collection sidebar for all team members

### Back to Draft (Review \u2192 Draft)

1. Click **Back to Draft** in the header
2. The system automatically:
   - Sets the condition status to "Draft"
   - Unpublishes all section documents (clears `publishedAt`)
   - Removes each document from the collection\u2019s document tree
   - Documents disappear from the collection sidebar

### Publish (Review \u2192 Published)

1. Click **Publish** in the header
2. The condition is marked as published
3. Documents remain published (no change to document visibility)

### Unpublish (Published \u2192 Draft)

1. Click **Unpublish** in the header
2. Works the same as "Back to Draft" \u2014 all documents are unpublished and removed from the collection tree

## What team members see

| Role | Draft conditions | Review conditions | Published conditions |
|------|-----------------|-------------------|---------------------|
| Condition creator | Full editor access | Full editor access | Full editor access |
| Team member | Not visible in collections | Can read documents in collection | Can read documents in collection |
| Team admin | Can see all conditions in the list | Full access | Full access |

## Tips for effective collaboration

- **Write in Draft** \u2014 take your time, use AI to generate starting content, and refine without pressure
- **Submit for Review** when you want feedback \u2014 this makes your work visible to the team
- **Use document comments** \u2014 team members can comment directly on section documents during review
- **Pull back to Draft** if major changes are needed \u2014 this hides the content again while you rework it
- **Publish** when the guide is ready for clinical use or sharing
