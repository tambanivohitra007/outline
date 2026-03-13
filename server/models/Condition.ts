import type { InferAttributes, InferCreationAttributes } from "sequelize";
import {
  DataType,
  Column,
  ForeignKey,
  BelongsTo,
  HasMany,
  Table,
  Default,
} from "sequelize-typescript";
import Collection from "./Collection";
import Document from "./Document";
import Team from "./Team";
import User from "./User";
import ParanoidModel from "./base/ParanoidModel";
import Fix from "./decorators/Fix";

@Table({ tableName: "conditions", modelName: "condition", paranoid: true })
@Fix
class Condition extends ParanoidModel<
  InferAttributes<Condition>,
  Partial<InferCreationAttributes<Condition>>
> {
  @Column
  name: string;

  @Column
  slug: string;

  @Column
  snomedCode: string | null;

  @Column
  icdCode: string | null;

  @Default("draft")
  @Column(DataType.ENUM("draft", "review", "published"))
  status: "draft" | "review" | "published";

  // associations

  @BelongsTo(() => Document, "overviewDocumentId")
  overviewDocument: Document | null;

  @ForeignKey(() => Document)
  @Column(DataType.UUID)
  overviewDocumentId: string | null;

  @BelongsTo(() => Collection, "collectionId")
  collection: Collection | null;

  @ForeignKey(() => Collection)
  @Column(DataType.UUID)
  collectionId: string | null;

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

  @HasMany(() => require("./ConditionSection").default, "conditionId")
  sections: import("./ConditionSection").default[];
}

export default Condition;
