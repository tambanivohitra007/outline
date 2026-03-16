This guide covers administrative tasks that require elevated permissions.

## Who is an administrator?

Administrators are team members with the **Admin** role. They have full access to all conditions, collections, and settings. Regular team members can create and edit conditions but cannot manage care domains or system settings.

## Managing care domains

Care domains represent the NEWSTART+ pillars and other therapeutic categories. They are **team-wide** and shared across all conditions.

### Viewing care domains
All team members can view the list of care domains.

### Creating a care domain
Only administrators can create new care domains. Each domain requires:
- **Name** \u2014 display name (e.g., "Nutrition")
- **Description** \u2014 what this domain covers
- **Icon** \u2014 visual identifier
- **Color** \u2014 hex color code for UI elements
- **Sort Order** \u2014 controls display position in lists

### Editing and deleting care domains
Only administrators can modify or remove care domains. Deleting a care domain does **not** delete interventions or scriptures linked to it \u2014 they become unlinked.

## AI model configuration

Administrators can select which AI model the team uses for content generation and review summaries.

### Changing the AI model
1. Go to team settings
2. Find the **AI Model** preference
3. Select from available models: Gemini 2.0 Flash, GPT-5.2, or Claude Sonnet 4.6

### API keys
AI services require API keys configured in the server environment:
- `GOOGLE_AI_API_KEY` \u2014 for Gemini models
- `OPENAI_API_KEY` \u2014 for GPT models
- `ANTHROPIC_API_KEY` \u2014 for Claude models

These are configured by the system administrator at the server level, not in the UI.

## External service configuration

The platform integrates with several external services. These require API keys or endpoint configuration at the server level:

| Service | Environment Variable | Purpose |
|---------|---------------------|---------|
| SNOMED CT | `SNOWSTORM_URL` | Medical terminology lookups |
| PubMed | No key required | Research article search |
| ClinicalTrials.gov | No key required | Clinical trial search |
| Bible API | `BIBLE_API_KEY` | Scripture verse search |
| EGW Writings | `EGW_API_URL` | Spirit of Prophecy search |

## Permissions summary

| Action | Team Member | Administrator |
|--------|------------|---------------|
| View conditions | Yes | Yes |
| Create conditions | Yes | Yes |
| Edit own conditions | Yes | Yes |
| Delete conditions | Yes | Yes |
| View care domains | Yes | Yes |
| Create/edit/delete care domains | No | Yes |
| View interventions | Yes | Yes |
| Create/edit/delete interventions | Yes | Yes |
| Add evidence entries | Yes | Yes |
| Add scripture references | Yes | Yes |
| Change AI model | No | Yes |
| Manage team members | No | Yes |
| FHIR export | Yes | Yes |

## Repairing conditions

If section documents become out of sync (e.g., documents exist but don\u2019t appear in the collection), administrators can use the **Repair** action:

1. Open the condition
2. Click the **Repair** option in the condition menu
3. The system re-publishes all section documents and ensures they appear in the collection structure

This is a safe operation \u2014 it does not delete or modify document content.
