import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import { transaction } from "@server/middlewares/transaction";
import validate from "@server/middlewares/validate";
import {
  Condition,
  ConditionIntervention,
  Intervention,
} from "@server/models";
import { authorize } from "@server/policies";
import presentConditionIntervention from "@server/presenters/conditionIntervention";
import type { APIContext } from "@server/types";
import * as T from "./schema";

const router = new Router();

router.post(
  "conditionInterventions.list",
  auth(),
  validate(T.ConditionInterventionsListSchema),
  async (ctx: APIContext<T.ConditionInterventionsListReq>) => {
    const { conditionId } = ctx.input.body;
    const { user } = ctx.state.auth;

    const condition = await Condition.findByPk(conditionId);
    if (!condition || condition.teamId !== user.teamId) {
      ctx.throw(404);
    }
    authorize(user, "read", condition);

    const links = await ConditionIntervention.findAll({
      where: { conditionId },
      include: [{ model: Intervention, as: "intervention" }],
      order: [["sortOrder", "ASC"]],
    });

    ctx.body = {
      data: links.map(presentConditionIntervention),
    };
  }
);

router.post(
  "conditionInterventions.create",
  auth(),
  validate(T.ConditionInterventionsCreateSchema),
  transaction(),
  async (ctx: APIContext<T.ConditionInterventionsCreateReq>) => {
    const { conditionId, interventionId, careDomainId, evidenceLevel, sortOrder } =
      ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const condition = await Condition.findByPk(conditionId, { transaction });
    if (!condition || condition.teamId !== user.teamId) {
      ctx.throw(404);
    }
    authorize(user, "update", condition);

    const intervention = await Intervention.findByPk(interventionId, {
      transaction,
    });
    if (!intervention || intervention.teamId !== user.teamId) {
      ctx.throw(404, "Intervention not found");
    }

    // Prevent duplicate links
    const existing = await ConditionIntervention.findOne({
      where: { conditionId, interventionId },
      transaction,
    });
    if (existing) {
      ctx.body = { data: presentConditionIntervention(existing) };
      return;
    }

    const link = await ConditionIntervention.create(
      {
        conditionId,
        interventionId,
        careDomainId: careDomainId ?? null,
        evidenceLevel: evidenceLevel ?? null,
        sortOrder: sortOrder ?? 0,
      },
      { transaction }
    );

    ctx.body = {
      data: presentConditionIntervention(link),
    };
  }
);

router.post(
  "conditionInterventions.delete",
  auth(),
  validate(T.ConditionInterventionsDeleteSchema),
  transaction(),
  async (ctx: APIContext<T.ConditionInterventionsDeleteReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const link = await ConditionIntervention.findByPk(id, { transaction });
    if (!link) {
      ctx.throw(404);
      return;
    }

    const condition = await Condition.findByPk(link.conditionId, {
      transaction,
    });
    if (!condition || condition.teamId !== user.teamId) {
      ctx.throw(404);
    }
    authorize(user, "update", condition);

    await link.destroy({ transaction });

    ctx.body = {
      success: true,
    };
  }
);

export default router;
