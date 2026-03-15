import { Team, User } from "@server/models";
import { allow } from "./cancan";
import {
  and,
  isCloudHosted,
  isTeamAdmin,
  isTeamModel,
  isTeamMutable,
} from "./utils";

allow(User, "read", Team, isTeamModel);

allow(User, "readTemplate", Team, (actor, team) =>
  and(
    //
    !actor.isGuest,
    !actor.isViewer,
    isTeamModel(actor, team)
  )
);

// Disabled: medical content should not be publicly shared
allow(User, "share", Team, () => false);

// Disabled: single-workspace platform — no team creation allowed
allow(User, "createTeam", Team, () => false);

allow(User, "update", Team, isTeamAdmin);

allow(User, ["delete", "audit"], Team, (actor, team) =>
  and(
    //
    isCloudHosted(),
    isTeamAdmin(actor, team)
  )
);

allow(User, ["createTemplate", "updateTemplate"], Team, (actor, team) =>
  and(
    //
    actor.isAdmin,
    isTeamModel(actor, team),
    isTeamMutable(actor)
  )
);
