import { z } from "zod";
import { BaseSchema } from "../schema";

export const CareDomainsListSchema = BaseSchema;

export type CareDomainsListReq = z.infer<typeof CareDomainsListSchema>;
