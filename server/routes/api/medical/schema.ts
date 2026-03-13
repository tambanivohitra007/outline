import { z } from "zod";
import { BaseSchema } from "../schema";

export const MedicalSnomedSearchSchema = BaseSchema.extend({
  body: z.object({
    term: z.string().min(1).max(255),
    limit: z.number().int().positive().max(50).optional(),
  }),
});

export type MedicalSnomedSearchReq = z.infer<typeof MedicalSnomedSearchSchema>;

export const MedicalSnomedLookupSchema = BaseSchema.extend({
  body: z.object({
    conceptId: z.string().min(1),
  }),
});

export type MedicalSnomedLookupReq = z.infer<typeof MedicalSnomedLookupSchema>;

export const MedicalPubmedSearchSchema = BaseSchema.extend({
  body: z.object({
    query: z.string().min(1).max(500),
    limit: z.number().int().positive().max(50).optional(),
  }),
});

export type MedicalPubmedSearchReq = z.infer<typeof MedicalPubmedSearchSchema>;

export const MedicalPubmedImportSchema = BaseSchema.extend({
  body: z.object({
    pmid: z.string().min(1),
    conditionId: z.uuid().optional(),
    interventionId: z.uuid().optional(),
  }),
});

export type MedicalPubmedImportReq = z.infer<typeof MedicalPubmedImportSchema>;

export const MedicalClinicalTrialsSearchSchema = BaseSchema.extend({
  body: z.object({
    query: z.string().min(1).max(500),
    limit: z.number().int().positive().max(50).optional(),
  }),
});

export type MedicalClinicalTrialsSearchReq = z.infer<typeof MedicalClinicalTrialsSearchSchema>;

export const MedicalBibleSearchSchema = BaseSchema.extend({
  body: z.object({
    query: z.string().min(1).max(255),
    translation: z.string().optional(),
    limit: z.number().int().positive().max(50).optional(),
  }),
});

export type MedicalBibleSearchReq = z.infer<typeof MedicalBibleSearchSchema>;

export const MedicalBibleLookupSchema = BaseSchema.extend({
  body: z.object({
    reference: z.string().min(1),
    translation: z.string().optional(),
  }),
});

export type MedicalBibleLookupReq = z.infer<typeof MedicalBibleLookupSchema>;
