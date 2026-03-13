import type { Recipe } from "@server/models";

export default function presentRecipe(recipe: Recipe) {
  return {
    id: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    description: recipe.description,
    servings: recipe.servings,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    dietaryTags: recipe.dietaryTags,
    nutritionData: recipe.nutritionData,
    documentId: recipe.documentId,
    teamId: recipe.teamId,
    createdById: recipe.createdById,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
}
