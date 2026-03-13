import { User, Condition } from "@server/models";
import { allow } from "./cancan";
import { isTeamModel } from "./utils";

allow(User, "read", Condition, isTeamModel);
allow(User, ["create", "update", "delete"], Condition, isTeamModel);
