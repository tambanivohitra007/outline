import type { ConditionIntervention } from "@server/models";

/**
 * Presents a condition-intervention link for the API response.
 *
 * @param ci The condition-intervention record.
 * @returns The presented object.
 */
export default function presentConditionIntervention(
  ci: ConditionIntervention
) {
  return {
    id: ci.id,
    conditionId: ci.conditionId,
    interventionId: ci.interventionId,
    careDomainId: ci.careDomainId,
    evidenceLevel: ci.evidenceLevel,
    sortOrder: ci.sortOrder,
    createdAt: ci.createdAt,
    updatedAt: ci.updatedAt,
  };
}
