import { observable } from "mobx";
import Model from "./base/Model";
import Field from "./decorators/Field";

class CareDomain extends Model {
  static modelName = "CareDomain";

  /** The name of the care domain */
  @Field
  @observable
  name: string;

  /** URL-safe slug */
  @Field
  @observable
  slug: string;

  /** Description of the care domain */
  @Field
  @observable
  description: string | null;

  /** Icon identifier */
  @Field
  @observable
  icon: string | null;

  /** Display color */
  @Field
  @observable
  color: string | null;

  /** Sort order for display */
  @Field
  @observable
  sortOrder: number;
}

export default CareDomain;
