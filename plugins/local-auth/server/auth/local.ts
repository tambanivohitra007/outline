import bcrypt from "bcryptjs";
import Router from "koa-router";
import { UserRole } from "@shared/types";
import env from "@server/env";
import { AuthorizationError, ValidationError } from "@server/errors";
import { rateLimiter } from "@server/middlewares/rateLimiter";
import validate from "@server/middlewares/validate";
import { User, Team } from "@server/models";
import type { APIContext } from "@server/types";
import { RateLimiterStrategy } from "@server/utils/RateLimiter";
import { signIn } from "@server/utils/authentication";
import * as T from "./schema";

const SALT_ROUNDS = 10;

const router = new Router();

router.post(
  "local-auth",
  rateLimiter(RateLimiterStrategy.TenPerHour),
  validate(T.LocalLoginSchema),
  async (ctx: APIContext<T.LocalLoginReq>) => {
    const { email, password } = ctx.input.body;

    const team = await Team.findOne();
    if (!team) {
      return ctx.redirect(`/?notice=auth-error&error=${encodeURIComponent("No team found")}`);
    }

    const user = await User.findOne({
      where: {
        teamId: team.id,
        email: email.toLowerCase(),
      },
    });

    if (!user || !user.passwordHash) {
      return ctx.redirect(`/?notice=auth-error&error=${encodeURIComponent("Invalid email or password")}`);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return ctx.redirect(`/?notice=auth-error&error=${encodeURIComponent("Invalid email or password")}`);
    }

    if (user.isSuspended) {
      return ctx.redirect(`/?notice=auth-error&error=${encodeURIComponent("Your account has been suspended")}`);
    }

    await signIn(ctx, "local-auth", {
      user,
      team,
      isNewTeam: false,
      isNewUser: false,
    });
  }
);

router.post(
  "local-auth.register",
  rateLimiter(RateLimiterStrategy.TenPerHour),
  validate(T.LocalRegisterSchema),
  async (ctx: APIContext<T.LocalRegisterReq>) => {
    const { name, email, password } = ctx.input.body;

    const team = await Team.findOne();
    if (!team) {
      throw AuthorizationError("No team found");
    }

    const existing = await User.findOne({
      where: {
        teamId: team.id,
        email: email.toLowerCase(),
      },
    });

    if (existing) {
      throw ValidationError("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      teamId: team.id,
      role: UserRole.Member,
    });

    await signIn(ctx, "local-auth", {
      user,
      team,
      isNewTeam: false,
      isNewUser: true,
    });
  }
);

export default router;
