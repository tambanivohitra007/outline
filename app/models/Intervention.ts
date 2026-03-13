import { observable } from "mobx";
import CareDomain from "./CareDomain";
import ParanoidModel from "./base/ParanoidModel";
import Field from "./decorators/Field";
import Relation from "./decorators/Relation";

class Intervention extends ParanoidModel {
  static modelName = "Intervention";

  /** The name of the intervention */
  @Field
  @observable
  name: string;

  /** URL-safe slug */
  @Field
  @observable
  slug: string;

  /** Category classification */
  @Field
  @observable
  category: string | null;

  /** Description of the intervention */
  @Field
  @observable
  description: string | null;

  /** The care domain ID */
  careDomainId: string | null;

  /** The care domain */
  @Relation(() => CareDomain)
  careDomain: CareDomain | null;

  /** The backing document ID */
  documentId: string | null;

  /** The team ID */
  teamId: string;

  /** The user ID who created this */
  createdById: string;
}

export default Intervention;
