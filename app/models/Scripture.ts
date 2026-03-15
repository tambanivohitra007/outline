import { observable } from "mobx";
import Model from "./base/Model";
import Field from "./decorators/Field";

class Scripture extends Model {
  static modelName = "Scripture";

  /** Scripture reference (e.g., "John 3:16") */
  @Field
  @observable
  reference: string;

  /** Full text of the scripture */
  @Field
  @observable
  text: string | null;

  /** Book of the Bible */
  @Field
  @observable
  book: string | null;

  /** Chapter number */
  @Field
  @observable
  chapter: number | null;

  /** Starting verse */
  @Field
  @observable
  verseStart: number | null;

  /** Ending verse */
  @Field
  @observable
  verseEnd: number | null;

  /** Bible translation */
  @Field
  @observable
  translation: string;

  /** Whether this is a Spirit of Prophecy quote */
  @Field
  @observable
  spiritOfProphecy: boolean;

  /** Spirit of Prophecy source book */
  @Field
  @observable
  sopSource: string | null;

  /** Spirit of Prophecy page reference */
  @Field
  @observable
  sopPage: string | null;

  /** Thematic category */
  @Field
  @observable
  theme: string | null;

  /** Associated care domain ID */
  @Field
  @observable
  careDomainId: string | null;

  /** Associated condition ID */
  conditionId: string | null;

  /** Associated intervention ID */
  interventionId: string | null;

  /** The team ID */
  teamId: string;
}

export default Scripture;
