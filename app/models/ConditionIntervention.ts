import { observable } from "mobx";
import Model from "./base/Model";
import Field from "./decorators/Field";

class ConditionIntervention extends Model {
  static modelName = "ConditionIntervention";

  /** The condition ID */
  @Field
  @observable
  conditionId: string;

  /** The intervention ID */
  @Field
  @observable
  interventionId: string;

  /** The care domain ID */
  @Field
  @observable
  careDomainId: string | null;

  /** Evidence level for this link */
  @Field
  @observable
  evidenceLevel: string | null;

  /** Display order */
  @Field
  @observable
  sortOrder: number;
}

export default ConditionIntervention;
