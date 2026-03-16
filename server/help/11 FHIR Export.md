The platform can export conditions and interventions in **FHIR R4** format, the international standard for healthcare data interoperability.

## What is FHIR?

FHIR (Fast Healthcare Interoperability Resources) is a standard for exchanging healthcare information electronically. It is maintained by HL7 International and widely adopted by hospitals, EHR systems, and health technology platforms.

## What gets exported

### Single condition export

Exports a single condition as a FHIR **Condition** resource, including:
- Condition name and codes (SNOMED CT, ICD)
- Clinical status
- Linked interventions as FHIR **CarePlan** activities
- References to evidence

### Bundle export

Exports multiple conditions as a FHIR **Bundle** containing:
- All selected Condition resources
- Related CarePlan resources
- Intervention references

## How to export

1. Open the condition you want to export
2. Click the **Export** or **FHIR Export** option in the condition menu
3. Choose between single condition or bundle export
4. The system generates a JSON file conforming to the FHIR R4 specification

## FHIR resource mapping

| Platform concept | FHIR resource | Key fields |
|-----------------|---------------|------------|
| Condition | Condition | code (SNOMED/ICD), clinicalStatus, category |
| Intervention | CarePlan.activity | detail.code, detail.description |
| Care Domain | CarePlan.category | text mapping to care domain name |

## Use cases

- **Sharing with other health systems** \u2014 import treatment guides into EHR systems
- **Regulatory compliance** \u2014 demonstrate structured clinical data management
- **Research collaboration** \u2014 share standardized condition data with research partners
- **Interoperability** \u2014 connect with health information exchanges (HIEs)

## Limitations

- Evidence entries and scripture references are **not** included in the FHIR export (no standard FHIR mapping)
- Document content (section text) is **not** included \u2014 only structured data is exported
- The export uses FHIR R4 (4.0.1); R5 is not currently supported
