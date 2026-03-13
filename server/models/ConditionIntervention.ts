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
import Intervention from "./Intervention";
import IdModel from "./base/IdModel";
import Fix from "./decorators/Fix";

@Table({
  tableName: "condition_interventions",
  modelName: "conditionIntervention",
})
@Fix
class ConditionIntervention extends IdModel<
  InferAttributes<ConditionIntervention>,
  Partial<InferCreationAttributes<ConditionIntervention>>
> {
  @Column
  evidenceLevel: string | null;

  @Column
  recommendationLevel: string | null;

  @Column(DataType.TEXT)
  clinicalNotes: string | null;

  @Default(0)
  @Column
  sortOrder: number;

  // associations

  @BelongsTo(() => Condition, "conditionId")
  condition: Condition;

  @ForeignKey(() => Condition)
  @Column(DataType.UUID)
  conditionId: string;

  @BelongsTo(() => Intervention, "interventionId")
  intervention: Intervention;

  @ForeignKey(() => Intervention)
  @Column(DataType.UUID)
  interventionId: string;

  @BelongsTo(() => CareDomain, "careDomainId")
  careDomain: CareDomain | null;

  @ForeignKey(() => CareDomain)
  @Column(DataType.UUID)
  careDomainId: string | null;
}

export default ConditionIntervention;
