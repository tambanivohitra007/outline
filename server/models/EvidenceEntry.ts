import type { InferAttributes, InferCreationAttributes } from "sequelize";
import {
  DataType,
  Column,
  ForeignKey,
  BelongsTo,
  Table,
} from "sequelize-typescript";
import Condition from "./Condition";
import Intervention from "./Intervention";
import Team from "./Team";
import User from "./User";
import IdModel from "./base/IdModel";
import Fix from "./decorators/Fix";

@Table({ tableName: "evidence_entries", modelName: "evidenceEntry" })
@Fix
class EvidenceEntry extends IdModel<
  InferAttributes<EvidenceEntry>,
  Partial<InferCreationAttributes<EvidenceEntry>>
> {
  @Column
  title: string;

  @Column
  pubmedId: string | null;

  @Column
  doi: string | null;

  @Column(DataType.TEXT)
  authors: string | null;

  @Column
  journal: string | null;

  @Column(DataType.DATE)
  publicationDate: Date | null;

  @Column(DataType.TEXT)
  abstract: string | null;

  @Column(DataType.STRING(2048))
  url: string | null;

  @Column
  studyType: string | null;

  @Column
  qualityRating: string | null;

  @Column
  sampleSize: number | null;

  @Column(DataType.TEXT)
  summary: string | null;

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

export default EvidenceEntry;
