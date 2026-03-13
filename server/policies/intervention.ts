import { User, Intervention } from "@server/models";
import { allow } from "./cancan";
import { isTeamModel } from "./utils";

allow(User, "read", Intervention, isTeamModel);
allow(User, ["create", "update", "delete"], Intervention, isTeamModel);
