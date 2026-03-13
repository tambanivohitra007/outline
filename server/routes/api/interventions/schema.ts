import { z } from "zod";
import { BaseSchema } from "../schema";

export const InterventionsListSchema = BaseSchema.extend({
  body: z.object({
    careDomainId: z.uuid().optional(),
    query: z.string().optional(),
  }).default({}),
});

export type InterventionsListReq = z.infer<typeof InterventionsListSchema>;

export const InterventionsInfoSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type InterventionsInfoReq = z.infer<typeof InterventionsInfoSchema>;

export const InterventionsCreateSchema = BaseSchema.extend({
  body: z.object({
    name: z.string().min(1).max(255),
    category: z.string().optional(),
    description: z.string().optional(),
    careDomainId: z.uuid().optional(),
  }),
});

export type InterventionsCreateReq = z.infer<typeof InterventionsCreateSchema>;

export const InterventionsUpdateSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
    name: z.string().min(1).max(255).optional(),
    category: z.string().nullish(),
    description: z.string().nullish(),
    careDomainId: z.uuid().nullish(),
  }),
});

export type InterventionsUpdateReq = z.infer<typeof InterventionsUpdateSchema>;

export const InterventionsDeleteSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type InterventionsDeleteReq = z.infer<typeof InterventionsDeleteSchema>;
