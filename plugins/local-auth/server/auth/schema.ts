import { z } from "zod";
import { BaseSchema } from "@server/routes/api/schema";

export const LocalLoginSchema = BaseSchema.extend({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export type LocalLoginReq = z.infer<typeof LocalLoginSchema>;

export const LocalRegisterSchema = BaseSchema.extend({
  body: z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    password: z.string().min(8).max(255),
  }),
});

export type LocalRegisterReq = z.infer<typeof LocalRegisterSchema>;
