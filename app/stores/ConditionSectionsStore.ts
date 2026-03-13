import { computed } from "mobx";
import ConditionSection from "~/models/ConditionSection";
import type RootStore from "./RootStore";
import Store from "./base/Store";

export default class ConditionSectionsStore extends Store<ConditionSection> {
  constructor(rootStore: RootStore) {
    super(rootStore, ConditionSection);
  }

  /**
   * Returns sections for a given condition, ordered by sortOrder.
   *
   * @param conditionId The condition ID to filter by.
   * @returns Ordered sections for the condition.
   */
  forCondition(conditionId: string): ConditionSection[] {
    return Array.from(this.data.values())
      .filter((s) => s.conditionId === conditionId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  @computed
  get orderedData(): ConditionSection[] {
    return Array.from(this.data.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
  }
}
