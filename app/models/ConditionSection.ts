import { observable } from "mobx";
import Model from "./base/Model";
import Field from "./decorators/Field";

class ConditionSection extends Model {
  static modelName = "ConditionSection";

  /** The condition this section belongs to */
  conditionId: string;

  /** The type of section */
  @Field
  @observable
  sectionType:
    | "risk_factors"
    | "physiology"
    | "complications"
    | "solutions"
    | "bible_sop"
    | "research_ideas";

  /** The care domain ID (for solutions sections) */
  @Field
  @observable
  careDomainId: string | null;

  /** The backing document ID for collaborative editing */
  documentId: string | null;

  /** Display title */
  @Field
  @observable
  title: string;

  /** Sort order */
  @Field
  @observable
  sortOrder: number;
}

export default ConditionSection;
