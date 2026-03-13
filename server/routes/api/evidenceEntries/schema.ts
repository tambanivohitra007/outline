import { z } from "zod";
import { BaseSchema } from "../schema";

export const EvidenceEntriesListSchema = BaseSchema.extend({
  body: z.object({
    conditionId: z.uuid().optional(),
    interventionId: z.uuid().optional(),
  }).default({}),
});

export type EvidenceEntriesListReq = z.infer<typeof EvidenceEntriesListSchema>;

export const EvidenceEntriesCreateSchema = BaseSchema.extend({
  body: z.object({
    title: z.string().min(1).max(500),
    pubmedId: z.string().optional(),
    doi: z.string().optional(),
    authors: z.string().optional(),
    journal: z.string().optional(),
    publicationDate: z.coerce.date().optional(),
    abstract: z.string().optional(),
    url: z.string().optional(),
    studyType: z.string().optional(),
    qualityRating: z.string().optional(),
    sampleSize: z.number().int().positive().optional(),
    summary: z.string().optional(),
    conditionId: z.uuid().optional(),
    interventionId: z.uuid().optional(),
  }),
});

export type EvidenceEntriesCreateReq = z.infer<typeof EvidenceEntriesCreateSchema>;

export const EvidenceEntriesUpdateSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
    title: z.string().min(1).max(500).optional(),
    pubmedId: z.string().nullish(),
    doi: z.string().nullish(),
    authors: z.string().nullish(),
    journal: z.string().nullish(),
    abstract: z.string().nullish(),
    url: z.string().nullish(),
    studyType: z.string().nullish(),
    qualityRating: z.string().nullish(),
    sampleSize: z.number().int().positive().nullish(),
    summary: z.string().nullish(),
  }),
});

export type EvidenceEntriesUpdateReq = z.infer<typeof EvidenceEntriesUpdateSchema>;

export const EvidenceEntriesDeleteSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type EvidenceEntriesDeleteReq = z.infer<typeof EvidenceEntriesDeleteSchema>;
