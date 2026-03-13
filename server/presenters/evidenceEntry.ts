import type { EvidenceEntry } from "@server/models";

export default function presentEvidenceEntry(entry: EvidenceEntry) {
  return {
    id: entry.id,
    title: entry.title,
    pubmedId: entry.pubmedId,
    doi: entry.doi,
    authors: entry.authors,
    journal: entry.journal,
    publicationDate: entry.publicationDate,
    abstract: entry.abstract,
    url: entry.url,
    studyType: entry.studyType,
    qualityRating: entry.qualityRating,
    sampleSize: entry.sampleSize,
    summary: entry.summary,
    conditionId: entry.conditionId,
    interventionId: entry.interventionId,
    teamId: entry.teamId,
    createdById: entry.createdById,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
