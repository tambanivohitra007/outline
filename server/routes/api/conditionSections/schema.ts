import { z } from "zod";
import { BaseSchema } from "../schema";

export const ConditionSectionsListSchema = BaseSchema.extend({
  body: z
    .object({
      conditionId: z.uuid(),
    })
    .default({}),
});

export type ConditionSectionsListReq = z.infer<
  typeof ConditionSectionsListSchema
>;
