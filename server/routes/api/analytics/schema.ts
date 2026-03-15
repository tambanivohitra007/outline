import { z } from "zod";
import { BaseSchema } from "../schema";

export const AnalyticsDashboardSchema = BaseSchema.extend({
  body: z.object({}).default({}),
});

export type AnalyticsDashboardReq = z.infer<typeof AnalyticsDashboardSchema>;

export const ConditionsGraphSchema = BaseSchema.extend({
  body: z.object({}).default({}),
});

export type ConditionsGraphReq = z.infer<typeof ConditionsGraphSchema>;

export const AnalyticsCoverageSchema = BaseSchema.extend({
  body: z.object({}).default({}),
});

export type AnalyticsCoverageReq = z.infer<typeof AnalyticsCoverageSchema>;

export const HomeDashboardSchema = BaseSchema.extend({
  body: z.object({}).default({}),
});

export type HomeDashboardReq = z.infer<typeof HomeDashboardSchema>;
