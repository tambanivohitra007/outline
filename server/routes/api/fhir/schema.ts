import { z } from "zod";
import { BaseSchema } from "../schema";

export const FHIRExportConditionSchema = BaseSchema.extend({
  body: z.object({
    conditionId: z.uuid(),
  }),
});

export type FHIRExportConditionReq = z.infer<typeof FHIRExportConditionSchema>;

export const FHIRExportBundleSchema = BaseSchema.extend({
  body: z.object({
    conditionIds: z.array(z.uuid()).optional(),
    interventionIds: z.array(z.uuid()).optional(),
  }),
});

export type FHIRExportBundleReq = z.infer<typeof FHIRExportBundleSchema>;
