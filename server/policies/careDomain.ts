import { User, CareDomain } from "@server/models";
import { allow } from "./cancan";
import { isTeamAdmin } from "./utils";

allow(User, "read", CareDomain);
allow(User, ["create", "update", "delete"], CareDomain, isTeamAdmin);
