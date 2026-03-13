import { observable } from "mobx";
import Model from "./base/Model";
import Field from "./decorators/Field";

class EvidenceEntry extends Model {
  static modelName = "EvidenceEntry";

  /** Title of the evidence */
  @Field
  @observable
  title: string;

  /** PubMed ID */
  @Field
  @observable
  pubmedId: string | null;

  /** Digital Object Identifier */
  @Field
  @observable
  doi: string | null;

  /** Author list */
  @Field
  @observable
  authors: string | null;

  /** Journal name */
  @Field
  @observable
  journal: string | null;

  /** Publication date */
  @Field
  @observable
  publicationDate: string | null;

  /** Abstract text */
  @Field
  @observable
  abstract: string | null;

  /** URL to the source */
  @Field
  @observable
  url: string | null;

  /** Type of study */
  @Field
  @observable
  studyType: string | null;

  /** Quality rating */
  @Field
  @observable
  qualityRating: string | null;

  /** Sample size */
  @Field
  @observable
  sampleSize: number | null;

  /** Summary of findings */
  @Field
  @observable
  summary: string | null;

  /** Associated condition ID */
  conditionId: string | null;

  /** Associated intervention ID */
  interventionId: string | null;

  /** The team ID */
  teamId: string;

  /** The user ID who created this */
  createdById: string;
}

export default EvidenceEntry;
