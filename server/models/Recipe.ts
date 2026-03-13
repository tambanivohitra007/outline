import type { InferAttributes, InferCreationAttributes } from "sequelize";
import {
  DataType,
  Column,
  ForeignKey,
  BelongsTo,
  Table,
} from "sequelize-typescript";
import Document from "./Document";
import Team from "./Team";
import User from "./User";
import ParanoidModel from "./base/ParanoidModel";
import Fix from "./decorators/Fix";

@Table({ tableName: "recipes", modelName: "recipe", paranoid: true })
@Fix
class Recipe extends ParanoidModel<
  InferAttributes<Recipe>,
  Partial<InferCreationAttributes<Recipe>>
> {
  @Column
  name: string;

  @Column
  slug: string;

  @Column(DataType.TEXT)
  description: string | null;

  @Column
  servings: number | null;

  @Column
  prepTime: number | null;

  @Column
  cookTime: number | null;

  @Column(DataType.JSONB)
  ingredients: object | null;

  @Column(DataType.JSONB)
  instructions: object | null;

  @Column(DataType.JSONB)
  dietaryTags: string[] | null;

  @Column(DataType.JSONB)
  nutritionData: object | null;

  // associations

  @BelongsTo(() => Document, "documentId")
  document: Document | null;

  @ForeignKey(() => Document)
  @Column(DataType.UUID)
  documentId: string | null;

  @BelongsTo(() => User, "createdById")
  createdBy: User;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  createdById: string;

  @BelongsTo(() => Team, "teamId")
  team: Team;

  @ForeignKey(() => Team)
  @Column(DataType.UUID)
  teamId: string;
}

export default Recipe;
