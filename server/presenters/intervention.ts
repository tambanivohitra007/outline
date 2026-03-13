import type { Intervention } from "@server/models";

export default function presentIntervention(intervention: Intervention) {
  return {
    id: intervention.id,
    name: intervention.name,
    slug: intervention.slug,
    category: intervention.category,
    description: intervention.description,
    careDomainId: intervention.careDomainId,
    documentId: intervention.documentId,
    teamId: intervention.teamId,
    createdById: intervention.createdById,
    createdAt: intervention.createdAt,
    updatedAt: intervention.updatedAt,
  };
}
