import { User, EvidenceEntry } from "@server/models";
import { allow } from "./cancan";
import { isTeamModel } from "./utils";

allow(User, "read", EvidenceEntry, isTeamModel);
allow(User, ["create", "update", "delete"], EvidenceEntry, isTeamModel);
