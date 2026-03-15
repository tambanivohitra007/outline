import { z } from "zod";
import { BaseSchema } from "../schema";

export const AIGenerateContentSchema = BaseSchema.extend({
  body: z.object({
    conditionName: z.string().min(1).max(255),
    sectionType: z.enum([
      "risk_factors",
      "physiology",
      "complications",
      "solutions",
      "bible_sop",
      "research_ideas",
    ]),
    existingContent: z.string().optional(),
    additionalContext: z.string().optional(),
  }),
});

export type AIGenerateContentReq = z.infer<typeof AIGenerateContentSchema>;

export const AISearchSchema = BaseSchema.extend({
  body: z.object({
    query: z.string().min(1).max(500),
  }),
});

export type AISearchReq = z.infer<typeof AISearchSchema>;

export const AISuggestSchema = BaseSchema.extend({
  body: z.object({
    conditionId: z.string().uuid(),
    sectionType: z.enum([
      "risk_factors",
      "physiology",
      "complications",
      "solutions",
      "bible_sop",
      "research_ideas",
    ]),
  }),
});

export type AISuggestReq = z.infer<typeof AISuggestSchema>;
