import { User, Scripture } from "@server/models";
import { allow } from "./cancan";
import { isTeamModel } from "./utils";

allow(User, "read", Scripture, isTeamModel);
allow(User, ["create", "update", "delete"], Scripture, isTeamModel);
