import { z } from "zod";
import { BaseSchema } from "../schema";

export const ConditionSectionsListSchema = BaseSchema.extend({
  body: z.object({
    conditionId: z.uuid(),
  }),
});

export type ConditionSectionsListReq = z.infer<
  typeof ConditionSectionsListSchema
>;

export const ConditionSectionsCreateDocumentSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type ConditionSectionsCreateDocumentReq = z.infer<
  typeof ConditionSectionsCreateDocumentSchema
>;
