import type { InferAttributes, InferCreationAttributes } from "sequelize";
import {
  DataType,
  Column,
  ForeignKey,
  BelongsTo,
  Table,
  Default,
} from "sequelize-typescript";
import Condition from "./Condition";
import Intervention from "./Intervention";
import Team from "./Team";
import IdModel from "./base/IdModel";
import Fix from "./decorators/Fix";

@Table({ tableName: "scriptures", modelName: "scripture" })
@Fix
class Scripture extends IdModel<
  InferAttributes<Scripture>,
  Partial<InferCreationAttributes<Scripture>>
> {
  @Column
  reference: string;

  @Column(DataType.TEXT)
  text: string | null;

  @Column
  book: string | null;

  @Column
  chapter: number | null;

  @Column
  verseStart: number | null;

  @Column
  verseEnd: number | null;

  @Default("KJV")
  @Column
  translation: string;

  @Column
  theme: string | null;

  @Default(false)
  @Column
  spiritOfProphecy: boolean;

  @Column
  sopSource: string | null;

  @Column
  sopPage: string | null;

  // associations

  @BelongsTo(() => Condition, "conditionId")
  condition: Condition | null;

  @ForeignKey(() => Condition)
  @Column(DataType.UUID)
  conditionId: string | null;

  @BelongsTo(() => Intervention, "interventionId")
  intervention: Intervention | null;

  @ForeignKey(() => Intervention)
  @Column(DataType.UUID)
  interventionId: string | null;

  @BelongsTo(() => Team, "teamId")
  team: Team;

  @ForeignKey(() => Team)
  @Column(DataType.UUID)
  teamId: string;
}

export default Scripture;
