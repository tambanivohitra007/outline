import type { InferAttributes, InferCreationAttributes } from "sequelize";
import {
  DataType,
  Column,
  ForeignKey,
  BelongsTo,
  Table,
  Default,
} from "sequelize-typescript";
import CareDomain from "./CareDomain";
import Condition from "./Condition";
import Recipe from "./Recipe";
import IdModel from "./base/IdModel";
import Fix from "./decorators/Fix";

@Table({ tableName: "condition_recipes", modelName: "conditionRecipe" })
@Fix
class ConditionRecipe extends IdModel<
  InferAttributes<ConditionRecipe>,
  Partial<InferCreationAttributes<ConditionRecipe>>
> {
  @Default(0)
  @Column
  sortOrder: number;

  // associations

  @BelongsTo(() => Condition, "conditionId")
  condition: Condition;

  @ForeignKey(() => Condition)
  @Column(DataType.UUID)
  conditionId: string;

  @BelongsTo(() => Recipe, "recipeId")
  recipe: Recipe;

  @ForeignKey(() => Recipe)
  @Column(DataType.UUID)
  recipeId: string;

  @BelongsTo(() => CareDomain, "careDomainId")
  careDomain: CareDomain | null;

  @ForeignKey(() => CareDomain)
  @Column(DataType.UUID)
  careDomainId: string | null;
}

export default ConditionRecipe;
