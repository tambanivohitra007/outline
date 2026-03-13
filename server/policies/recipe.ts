import { User, Recipe } from "@server/models";
import { allow } from "./cancan";
import { isTeamModel } from "./utils";

allow(User, "read", Recipe, isTeamModel);
allow(User, ["create", "update", "delete"], Recipe, isTeamModel);
