import { computed } from "mobx";
import Intervention from "~/models/Intervention";
import type RootStore from "./RootStore";
import Store from "./base/Store";

export default class InterventionsStore extends Store<Intervention> {
  constructor(rootStore: RootStore) {
    super(rootStore, Intervention);
  }

  @computed
  get orderedData(): Intervention[] {
    return Array.from(this.data.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Returns interventions filtered by care domain.
   *
   * @param careDomainId The care domain ID to filter by.
   * @returns Filtered interventions.
   */
  byCareDomain(careDomainId: string): Intervention[] {
    return this.orderedData.filter((i) => i.careDomainId === careDomainId);
  }
}
