import { z } from "zod";
import { BaseSchema } from "../schema";

export const ConditionInterventionsListSchema = BaseSchema.extend({
  body: z.object({
    conditionId: z.uuid(),
  }),
});

export type ConditionInterventionsListReq = z.infer<
  typeof ConditionInterventionsListSchema
>;

export const ConditionInterventionsCreateSchema = BaseSchema.extend({
  body: z.object({
    conditionId: z.uuid(),
    interventionId: z.uuid(),
    careDomainId: z.uuid().optional(),
    evidenceLevel: z.string().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

export type ConditionInterventionsCreateReq = z.infer<
  typeof ConditionInterventionsCreateSchema
>;

export const ConditionInterventionsDeleteSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type ConditionInterventionsDeleteReq = z.infer<
  typeof ConditionInterventionsDeleteSchema
>;
