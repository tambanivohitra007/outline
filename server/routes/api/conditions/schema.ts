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
    description: z.string().max(2000).nullish(),
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
    description: z.string().max(2000).nullish(),
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

export const ConditionsStatusSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
    status: z.enum(["draft", "review", "published"]),
  }),
});

export type ConditionsStatusReq = z.infer<typeof ConditionsStatusSchema>;

export const ConditionsCompileSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type ConditionsCompileReq = z.infer<typeof ConditionsCompileSchema>;

export const ConditionsRepairSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type ConditionsRepairReq = z.infer<typeof ConditionsRepairSchema>;
