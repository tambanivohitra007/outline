import type { InferAttributes, InferCreationAttributes } from "sequelize";
import { DataType, Column, Table, HasMany, Default } from "sequelize-typescript";
import IdModel from "./base/IdModel";
import Fix from "./decorators/Fix";

@Table({ tableName: "care_domains", modelName: "careDomain" })
@Fix
class CareDomain extends IdModel<
  InferAttributes<CareDomain>,
  Partial<InferCreationAttributes<CareDomain>>
> {
  @Column
  name: string;

  @Column
  slug: string;

  @Column(DataType.TEXT)
  description: string | null;

  @Column
  icon: string | null;

  @Column
  color: string | null;

  @Default(0)
  @Column
  sortOrder: number;

  // associations

  @HasMany(() => require("./Intervention").default, "careDomainId")
  interventions: import("./Intervention").default[];
}

export default CareDomain;
