import Router from "koa-router";
import slugify from "@shared/utils/slugify";
import auth from "@server/middlewares/authentication";
import { transaction } from "@server/middlewares/transaction";
import validate from "@server/middlewares/validate";
import { Intervention } from "@server/models";
import { authorize } from "@server/policies";
import { presentIntervention, presentPolicies } from "@server/presenters";
import type { APIContext } from "@server/types";
import pagination from "../middlewares/pagination";
import * as T from "./schema";

const router = new Router();

router.post(
  "interventions.list",
  auth(),
  pagination(),
  validate(T.InterventionsListSchema),
  async (ctx: APIContext<T.InterventionsListReq>) => {
    const { user } = ctx.state.auth;
    const { careDomainId } = ctx.input.body;

    const where: Record<string, unknown> = { teamId: user.teamId };
    if (careDomainId) {
      where.careDomainId = careDomainId;
    }

    const interventions = await Intervention.findAll({
      where,
      order: [["name", "ASC"]],
      offset: ctx.state.pagination.offset,
      limit: ctx.state.pagination.limit,
    });

    ctx.body = {
      pagination: ctx.state.pagination,
      data: interventions.map(presentIntervention),
      policies: presentPolicies(user, interventions),
    };
  }
);

router.post(
  "interventions.info",
  auth(),
  validate(T.InterventionsInfoSchema),
  async (ctx: APIContext<T.InterventionsInfoReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;

    const intervention = await Intervention.findByPk(id);
    if (!intervention || intervention.teamId !== user.teamId) {
      ctx.throw(404);
    }
    authorize(user, "read", intervention);

    ctx.body = {
      data: presentIntervention(intervention!),
      policies: presentPolicies(user, [intervention!]),
    };
  }
);

router.post(
  "interventions.create",
  auth(),
  validate(T.InterventionsCreateSchema),
  transaction(),
  async (ctx: APIContext<T.InterventionsCreateReq>) => {
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;
    const { name, category, description, careDomainId } = ctx.input.body;

    const intervention = await Intervention.create(
      {
        name,
        slug: slugify(name),
        category: category ?? null,
        description: description ?? null,
        careDomainId: careDomainId ?? null,
        teamId: user.teamId,
        createdById: user.id,
      },
      { transaction }
    );

    ctx.body = {
      data: presentIntervention(intervention),
      policies: presentPolicies(user, [intervention]),
    };
  }
);

router.post(
  "interventions.update",
  auth(),
  validate(T.InterventionsUpdateSchema),
  transaction(),
  async (ctx: APIContext<T.InterventionsUpdateReq>) => {
    const { id, ...updates } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const intervention = await Intervention.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!intervention || intervention.teamId !== user.teamId) {
      ctx.throw(404);
    }
    authorize(user, "update", intervention);

    if (updates.name) {
      (updates as Record<string, unknown>).slug = slugify(updates.name);
    }

    await intervention!.update(updates, { transaction });

    ctx.body = {
      data: presentIntervention(intervention!),
      policies: presentPolicies(user, [intervention!]),
    };
  }
);

router.post(
  "interventions.delete",
  auth(),
  validate(T.InterventionsDeleteSchema),
  transaction(),
  async (ctx: APIContext<T.InterventionsDeleteReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const intervention = await Intervention.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!intervention || intervention.teamId !== user.teamId) {
      ctx.throw(404);
    }
    authorize(user, "delete", intervention);

    await intervention!.destroy({ transaction });

    ctx.body = {
      success: true,
    };
  }
);

export default router;
