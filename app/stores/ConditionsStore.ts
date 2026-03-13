import { computed } from "mobx";
import Condition from "~/models/Condition";
import type RootStore from "./RootStore";
import Store from "./base/Store";

export default class ConditionsStore extends Store<Condition> {
  constructor(rootStore: RootStore) {
    super(rootStore, Condition);
  }

  @computed
  get orderedData(): Condition[] {
    return Array.from(this.data.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Returns conditions filtered by status.
   *
   * @param status The publication status to filter by.
   * @returns Filtered conditions.
   */
  byStatus(status: "draft" | "review" | "published"): Condition[] {
    return this.orderedData.filter((c) => c.status === status);
  }
}
