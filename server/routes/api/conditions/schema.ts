import { z } from "zod";
import { BaseSchema } from "../schema";

export const ConditionsListSchema = BaseSchema.extend({
  body: z.object({
    status: z.enum(["draft", "review", "published"]).optional(),
    query: z.string().optional(),
  }).default({}),
});

export type ConditionsListReq = z.infer<typeof ConditionsListSchema>;

export const ConditionsInfoSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type ConditionsInfoReq = z.infer<typeof ConditionsInfoSchema>;

export const ConditionsCreateSchema = BaseSchema.extend({
  body: z.object({
    name: z.string().min(1).max(255),
    snomedCode: z.string().optional(),
    icdCode: z.string().optional(),
    collectionId: z.uuid().optional(),
  }),
});

export type ConditionsCreateReq = z.infer<typeof ConditionsCreateSchema>;

export const ConditionsUpdateSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
    name: z.string().min(1).max(255).optional(),
    snomedCode: z.string().nullish(),
    icdCode: z.string().nullish(),
    status: z.enum(["draft", "review", "published"]).optional(),
  }),
});

export type ConditionsUpdateReq = z.infer<typeof ConditionsUpdateSchema>;

export const ConditionsDeleteSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type ConditionsDeleteReq = z.infer<typeof ConditionsDeleteSchema>;

export const ConditionsSectionsSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type ConditionsSectionsReq = z.infer<typeof ConditionsSectionsSchema>;
