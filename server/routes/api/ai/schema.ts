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
