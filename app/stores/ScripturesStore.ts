import { computed } from "mobx";
import Scripture from "~/models/Scripture";
import type RootStore from "./RootStore";
import Store from "./base/Store";

export default class ScripturesStore extends Store<Scripture> {
  constructor(rootStore: RootStore) {
    super(rootStore, Scripture);
  }

  @computed
  get orderedData(): Scripture[] {
    return Array.from(this.data.values()).sort((a, b) =>
      a.reference.localeCompare(b.reference)
    );
  }

  /**
   * Returns scriptures for a given condition.
   *
   * @param conditionId The condition ID to filter by.
   * @returns Scriptures for the condition.
   */
  forCondition(conditionId: string): Scripture[] {
    return this.orderedData.filter((s) => s.conditionId === conditionId);
  }

  /**
   * Returns Spirit of Prophecy entries only.
   *
   * @returns Spirit of Prophecy scriptures.
   */
  @computed
  get spiritOfProphecy(): Scripture[] {
    return this.orderedData.filter((s) => s.spiritOfProphecy);
  }
}
