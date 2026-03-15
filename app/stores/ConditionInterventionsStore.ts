import { computed } from "mobx";
import ConditionIntervention from "~/models/ConditionIntervention";
import type RootStore from "./RootStore";
import Store from "./base/Store";

export default class ConditionInterventionsStore extends Store<ConditionIntervention> {
  constructor(rootStore: RootStore) {
    super(rootStore, ConditionIntervention);
  }

  /**
   * Returns condition-intervention links for a given condition.
   *
   * @param conditionId The condition ID.
   * @returns Filtered links sorted by sortOrder.
   */
  forCondition(conditionId: string): ConditionIntervention[] {
    return Array.from(this.data.values())
      .filter((ci) => ci.conditionId === conditionId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  @computed
  get orderedData(): ConditionIntervention[] {
    return Array.from(this.data.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
  }
}
