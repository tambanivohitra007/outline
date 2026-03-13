import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import { transaction } from "@server/middlewares/transaction";
import validate from "@server/middlewares/validate";
import { Scripture } from "@server/models";
import { authorize } from "@server/policies";
import { presentScripture, presentPolicies } from "@server/presenters";
import type { APIContext } from "@server/types";
import pagination from "../middlewares/pagination";
import * as T from "./schema";

const router = new Router();

router.post(
  "scriptures.list",
  auth(),
  pagination(),
  validate(T.ScripturesListSchema),
  async (ctx: APIContext<T.ScripturesListReq>) => {
    const { user } = ctx.state.auth;
    const { conditionId, interventionId, spiritOfProphecy } = ctx.input.body;

    const where: Record<string, unknown> = { teamId: user.teamId };
    if (conditionId) {
      where.conditionId = conditionId;
    }
    if (interventionId) {
      where.interventionId = interventionId;
    }
    if (spiritOfProphecy !== undefined) {
      where.spiritOfProphecy = spiritOfProphecy;
    }

    const scriptures = await Scripture.findAll({
      where,
      order: [["reference", "ASC"]],
      offset: ctx.state.pagination.offset,
      limit: ctx.state.pagination.limit,
    });

    ctx.body = {
      pagination: ctx.state.pagination,
      data: scriptures.map(presentScripture),
      policies: presentPolicies(user, scriptures),
    };
  }
);

router.post(
  "scriptures.create",
  auth(),
  validate(T.ScripturesCreateSchema),
  transaction(),
  async (ctx: APIContext<T.ScripturesCreateReq>) => {
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const scripture = await Scripture.create(
      {
        ...ctx.input.body,
        teamId: user.teamId,
      },
      { transaction }
    );

    ctx.body = {
      data: presentScripture(scripture),
      policies: presentPolicies(user, [scripture]),
    };
  }
);

router.post(
  "scriptures.update",
  auth(),
  validate(T.ScripturesUpdateSchema),
  transaction(),
  async (ctx: APIContext<T.ScripturesUpdateReq>) => {
    const { id, ...updates } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const scripture = await Scripture.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    authorize(user, "update", scripture);

    await scripture!.update(updates, { transaction });

    ctx.body = {
      data: presentScripture(scripture!),
      policies: presentPolicies(user, [scripture!]),
    };
  }
);

router.post(
  "scriptures.delete",
  auth(),
  validate(T.ScripturesDeleteSchema),
  transaction(),
  async (ctx: APIContext<T.ScripturesDeleteReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const scripture = await Scripture.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    authorize(user, "delete", scripture);

    await scripture!.destroy({ transaction });

    ctx.body = {
      success: true,
    };
  }
);

export default router;
