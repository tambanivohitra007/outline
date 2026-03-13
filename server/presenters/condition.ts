import type { Condition } from "@server/models";
import presentConditionSection from "./conditionSection";

export default function presentCondition(condition: Condition) {
  return {
    id: condition.id,
    name: condition.name,
    slug: condition.slug,
    snomedCode: condition.snomedCode,
    icdCode: condition.icdCode,
    status: condition.status,
    overviewDocumentId: condition.overviewDocumentId,
    collectionId: condition.collectionId,
    teamId: condition.teamId,
    createdById: condition.createdById,
    sections: condition.sections
      ? condition.sections.map(presentConditionSection)
      : undefined,
    createdAt: condition.createdAt,
    updatedAt: condition.updatedAt,
  };
}
