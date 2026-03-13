import type { ConditionSection } from "@server/models";

export default function presentConditionSection(section: ConditionSection) {
  return {
    id: section.id,
    conditionId: section.conditionId,
    sectionType: section.sectionType,
    careDomainId: section.careDomainId,
    documentId: section.documentId,
    title: section.title,
    sortOrder: section.sortOrder,
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
  };
}
