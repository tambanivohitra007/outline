import { computed } from "mobx";
import EvidenceEntry from "~/models/EvidenceEntry";
import type RootStore from "./RootStore";
import Store from "./base/Store";

export default class EvidenceEntriesStore extends Store<EvidenceEntry> {
  constructor(rootStore: RootStore) {
    super(rootStore, EvidenceEntry);
  }

  @computed
  get orderedData(): EvidenceEntry[] {
    return Array.from(this.data.values()).sort((a, b) =>
      a.createdAt > b.createdAt ? -1 : 1
    );
  }

  /**
   * Returns evidence entries for a given condition.
   *
   * @param conditionId The condition ID to filter by.
   * @returns Evidence entries for the condition.
   */
  forCondition(conditionId: string): EvidenceEntry[] {
    return this.orderedData.filter((e) => e.conditionId === conditionId);
  }

  /**
   * Returns evidence entries for a given intervention.
   *
   * @param interventionId The intervention ID to filter by.
   * @returns Evidence entries for the intervention.
   */
  forIntervention(interventionId: string): EvidenceEntry[] {
    return this.orderedData.filter((e) => e.interventionId === interventionId);
  }
}
