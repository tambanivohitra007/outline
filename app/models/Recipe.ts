import { observable } from "mobx";
import ParanoidModel from "./base/ParanoidModel";
import Field from "./decorators/Field";

class Recipe extends ParanoidModel {
  static modelName = "Recipe";

  /** Recipe name */
  @Field
  @observable
  name: string;

  /** URL-safe slug */
  @Field
  @observable
  slug: string;

  /** Recipe description */
  @Field
  @observable
  description: string | null;

  /** Number of servings */
  @Field
  @observable
  servings: number | null;

  /** Preparation time in minutes */
  @Field
  @observable
  prepTime: number | null;

  /** Cooking time in minutes */
  @Field
  @observable
  cookTime: number | null;

  /** Ingredient list (JSONB) */
  @Field
  @observable
  ingredients: unknown[] | null;

  /** Instructions (JSONB) */
  @Field
  @observable
  instructions: unknown[] | null;

  /** Dietary tags */
  @Field
  @observable
  dietaryTags: string[] | null;

  /** Nutrition data (JSONB) */
  @Field
  @observable
  nutritionData: Record<string, unknown> | null;

  /** Backing document ID */
  documentId: string | null;

  /** The team ID */
  teamId: string;

  /** The user ID who created this */
  createdById: string;
}

export default Recipe;
