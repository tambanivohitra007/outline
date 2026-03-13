import { z } from "zod";
import { BaseSchema } from "../schema";

export const RecipesListSchema = BaseSchema.extend({
  body: z.object({
    query: z.string().optional(),
  }).default({}),
});

export type RecipesListReq = z.infer<typeof RecipesListSchema>;

export const RecipesInfoSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type RecipesInfoReq = z.infer<typeof RecipesInfoSchema>;

export const RecipesCreateSchema = BaseSchema.extend({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    servings: z.number().int().positive().optional(),
    prepTime: z.number().int().nonnegative().optional(),
    cookTime: z.number().int().nonnegative().optional(),
    ingredients: z.array(z.unknown()).optional(),
    instructions: z.array(z.unknown()).optional(),
    dietaryTags: z.array(z.string()).optional(),
  }),
});

export type RecipesCreateReq = z.infer<typeof RecipesCreateSchema>;

export const RecipesUpdateSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullish(),
    servings: z.number().int().positive().nullish(),
    prepTime: z.number().int().nonnegative().nullish(),
    cookTime: z.number().int().nonnegative().nullish(),
    ingredients: z.array(z.unknown()).nullish(),
    instructions: z.array(z.unknown()).nullish(),
    dietaryTags: z.array(z.string()).nullish(),
  }),
});

export type RecipesUpdateReq = z.infer<typeof RecipesUpdateSchema>;

export const RecipesDeleteSchema = BaseSchema.extend({
  body: z.object({
    id: z.uuid(),
  }),
});

export type RecipesDeleteReq = z.infer<typeof RecipesDeleteSchema>;
