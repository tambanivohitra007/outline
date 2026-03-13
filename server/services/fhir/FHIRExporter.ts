import type Condition from "@server/models/Condition";
import type Intervention from "@server/models/Intervention";

interface FHIRResource {
  resourceType: string;
  id: string;
  meta: {
    profile: string[];
  };
  [key: string]: unknown;
}

/**
 * Service for exporting medical data as FHIR R4 resources.
 */
export default class FHIRExporter {
  /**
   * Convert a Condition model to a FHIR R4 Condition resource.
   *
   * @param condition The condition model.
   * @returns FHIR R4 Condition resource.
   */
  static conditionToFHIR(condition: Condition): FHIRResource {
    const resource: FHIRResource = {
      resourceType: "Condition",
      id: condition.id,
      meta: {
        profile: [
          "http://hl7.org/fhir/StructureDefinition/Condition",
        ],
      },
      clinicalStatus: {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
            display: "Active",
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code:
              condition.status === "published" ? "confirmed" : "provisional",
            display:
              condition.status === "published" ? "Confirmed" : "Provisional",
          },
        ],
      },
      code: {
        text: condition.name,
        ...(condition.snomedCode
          ? {
              coding: [
                {
                  system: "http://snomed.info/sct",
                  code: condition.snomedCode,
                  display: condition.name,
                },
              ],
            }
          : {}),
      },
    };

    if (condition.icdCode) {
      const codeCoding = (resource.code as Record<string, unknown>).coding as Array<Record<string, string>> ?? [];
      codeCoding.push({
        system: "http://hl7.org/fhir/sid/icd-10-cm",
        code: condition.icdCode,
        display: condition.name,
      });
      (resource.code as Record<string, unknown>).coding = codeCoding;
    }

    return resource;
  }

  /**
   * Convert an Intervention model to a FHIR R4 Procedure resource.
   *
   * @param intervention The intervention model.
   * @returns FHIR R4 Procedure resource.
   */
  static interventionToFHIR(intervention: Intervention): FHIRResource {
    return {
      resourceType: "Procedure",
      id: intervention.id,
      meta: {
        profile: [
          "http://hl7.org/fhir/StructureDefinition/Procedure",
        ],
      },
      status: "preparation",
      code: {
        text: intervention.name,
      },
      category: intervention.category
        ? {
            text: intervention.category,
          }
        : undefined,
      note: intervention.description
        ? [{ text: intervention.description }]
        : undefined,
    };
  }

  /**
   * Create a FHIR R4 Bundle from multiple resources.
   *
   * @param resources Array of FHIR resources.
   * @returns FHIR R4 Bundle resource.
   */
  static createBundle(resources: FHIRResource[]): FHIRResource {
    return {
      resourceType: "Bundle",
      id: `bundle-${Date.now()}`,
      meta: {
        profile: [],
      },
      type: "collection",
      total: resources.length,
      entry: resources.map((resource) => ({
        resource,
        fullUrl: `urn:uuid:${resource.id}`,
      })),
    };
  }
}
