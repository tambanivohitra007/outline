import { observable } from "mobx";
import Collection from "./Collection";
import Document from "./Document";
import ParanoidModel from "./base/ParanoidModel";
import Field from "./decorators/Field";
import Relation from "./decorators/Relation";

class Condition extends ParanoidModel {
  static modelName = "Condition";

  /** The name of the medical condition */
  @Field
  @observable
  name: string;

  /** URL-safe slug */
  @Field
  @observable
  slug: string;

  /** SNOMED CT concept code */
  @Field
  @observable
  snomedCode: string | null;

  /** ICD-10/11 code */
  @Field
  @observable
  icdCode: string | null;

  /** Short description of the condition */
  @Field
  @observable
  description: string | null;

  /** Publication status */
  @Field
  @observable
  status: "draft" | "review" | "published";

  /** The overview document ID */
  overviewDocumentId: string | null;

  /** The overview document */
  @Relation(() => Document)
  overviewDocument: Document | null;

  /** The collection ID */
  collectionId: string | null;

  /** The collection */
  @Relation(() => Collection)
  collection: Collection | null;

  /** The team ID */
  teamId: string;

  /** The user ID who created this condition */
  createdById: string;
}

export default Condition;
