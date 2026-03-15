import { z } from "zod";
import { BaseSchema } from "../schema";

export const ScripturesListSchema = BaseSchema.extend({
  body: z.object({
    conditionId: z.uuid().optional(),
    interventionId: z.uuid().optional(),
    careDomainId: z.uuid().optional(),
    spiritOfProphecy: z.boolean().optional(),
  }).default({}),
});

export type ScripturesListReq = z.infer<typeof ScripturesListSchema>;

export const ScripturesCreateSchema = BaseSchema.extend({
  body: z.object({
    reference: z.string().min(1).max(255),
    text: z.string().optional(),
    book: z.string().optional(),
    chapter: z.number().int().positive().optional(),
    verseStart: z.number().int().positive().optional(),
    verseEnd: z.number().int().positive().optional(),
    translation: z.string().optional(),
    theme: z.string().optional(),
    spiritOfProphecy: z.boolean().optional(),
    sopSource: z.string().optional(),
    sopPage: z.string().optional(),
    conditionId: z.uuid().optional(),
    interventionId: z.uuid().optional(),
    careDomainId: z.uuid().optional(),
  }),
});

export type ScripturesCreateReq = z.infer<typeof ScripturesCreateSchema>;

export const ScripturesUpdateSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
    reference: z.string().min(1).max(255).optional(),
    text: z.string().nullish(),
    theme: z.string().nullish(),
    spiritOfProphecy: z.boolean().optional(),
    sopSource: z.string().nullish(),
    sopPage: z.string().nullish(),
  }),
});

export type ScripturesUpdateReq = z.infer<typeof ScripturesUpdateSchema>;

export const ScripturesDeleteSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type ScripturesDeleteReq = z.infer<typeof ScripturesDeleteSchema>;
