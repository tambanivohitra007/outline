import { computed } from "mobx";
import Recipe from "~/models/Recipe";
import type RootStore from "./RootStore";
import Store from "./base/Store";

export default class RecipesStore extends Store<Recipe> {
  constructor(rootStore: RootStore) {
    super(rootStore, Recipe);
  }

  @computed
  get orderedData(): Recipe[] {
    return Array.from(this.data.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
}
