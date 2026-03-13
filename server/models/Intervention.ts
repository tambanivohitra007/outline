import type { InferAttributes, InferCreationAttributes } from "sequelize";
import {
  DataType,
  Column,
  ForeignKey,
  BelongsTo,
  Table,
} from "sequelize-typescript";
import CareDomain from "./CareDomain";
import Document from "./Document";
import Team from "./Team";
import User from "./User";
import ParanoidModel from "./base/ParanoidModel";
import Fix from "./decorators/Fix";

@Table({
  tableName: "interventions",
  modelName: "intervention",
  paranoid: true,
})
@Fix
class Intervention extends ParanoidModel<
  InferAttributes<Intervention>,
  Partial<InferCreationAttributes<Intervention>>
> {
  @Column
  name: string;

  @Column
  slug: string;

  @Column
  category: string | null;

  @Column(DataType.TEXT)
  description: string | null;

  // associations

  @BelongsTo(() => CareDomain, "careDomainId")
  careDomain: CareDomain | null;

  @ForeignKey(() => CareDomain)
  @Column(DataType.UUID)
  careDomainId: string | null;

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

export default Intervention;
