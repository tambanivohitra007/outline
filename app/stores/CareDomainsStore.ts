import { computed } from "mobx";
import CareDomain from "~/models/CareDomain";
import type RootStore from "./RootStore";
import Store from "./base/Store";

export default class CareDomainsStore extends Store<CareDomain> {
  constructor(rootStore: RootStore) {
    super(rootStore, CareDomain);
  }

  @computed
  get orderedData(): CareDomain[] {
    return Array.from(this.data.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
  }
}
