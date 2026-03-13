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
import Document from "./Document";
import IdModel from "./base/IdModel";
import Fix from "./decorators/Fix";

@Table({ tableName: "condition_sections", modelName: "conditionSection" })
@Fix
class ConditionSection extends IdModel<
  InferAttributes<ConditionSection>,
  Partial<InferCreationAttributes<ConditionSection>>
> {
  @Column(
    DataType.ENUM(
      "risk_factors",
      "physiology",
      "complications",
      "solutions",
      "bible_sop",
      "research_ideas"
    )
  )
  sectionType:
    | "risk_factors"
    | "physiology"
    | "complications"
    | "solutions"
    | "bible_sop"
    | "research_ideas";

  @Column
  title: string;

  @Default(0)
  @Column
  sortOrder: number;

  // associations

  @BelongsTo(() => Condition, "conditionId")
  condition: Condition;

  @ForeignKey(() => Condition)
  @Column(DataType.UUID)
  conditionId: string;

  @BelongsTo(() => Document, "documentId")
  document: Document | null;

  @ForeignKey(() => Document)
  @Column(DataType.UUID)
  documentId: string | null;

  @BelongsTo(() => CareDomain, "careDomainId")
  careDomain: CareDomain | null;

  @ForeignKey(() => CareDomain)
  @Column(DataType.UUID)
  careDomainId: string | null;
}

export default ConditionSection;
