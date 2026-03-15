import Router from "koa-router";
import slugify from "@shared/utils/slugify";
import auth from "@server/middlewares/authentication";
import { transaction } from "@server/middlewares/transaction";
import validate from "@server/middlewares/validate";
import conditionCreator from "@server/commands/conditionCreator";
import { Collection, Condition, ConditionSection, Document } from "@server/models";
import { authorize } from "@server/policies";
import {
  presentCondition,
  presentPolicies,
} from "@server/presenters";
import type { APIContext } from "@server/types";
import pagination from "../middlewares/pagination";
import * as T from "./schema";

const router = new Router();

router.post(
  "conditions.list",
  auth(),
  pagination(),
  validate(T.ConditionsListSchema),
  async (ctx: APIContext<T.ConditionsListReq>) => {
    const { user } = ctx.state.auth;
    const { status, query } = ctx.input.body;

    const where: Record<string, unknown> = { teamId: user.teamId };
    if (status) {
      where.status = status;
    }

    const conditions = await Condition.findAll({
      where,
      order: [["name", "ASC"]],
      offset: ctx.state.pagination.offset,
      limit: ctx.state.pagination.limit,
    });

    ctx.body = {
      pagination: ctx.state.pagination,
      data: conditions.map(presentCondition),
      policies: presentPolicies(user, conditions),
    };
  }
);

router.post(
  "conditions.info",
  auth(),
  validate(T.ConditionsInfoSchema),
  async (ctx: APIContext<T.ConditionsInfoReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;

    const condition = await Condition.findByPk(id, {
      include: [{ model: ConditionSection, as: "sections" }],
    });
    if (!condition || condition.teamId !== user.teamId) {
      ctx.throw(404);
    }
    authorize(user, "read", condition);

    ctx.body = {
      data: presentCondition(condition!),
      policies: presentPolicies(user, [condition!]),
    };
  }
);

router.post(
  "conditions.create",
  auth(),
  validate(T.ConditionsCreateSchema),
  transaction(),
  async (ctx: APIContext<T.ConditionsCreateReq>) => {
    const { user } = ctx.state.auth;
    const { name, snomedCode, icdCode, collectionId } = ctx.input.body;

    const condition = await conditionCreator(ctx, {
      name,
      snomedCode,
      icdCode,
      collectionId,
    });

    ctx.body = {
      data: presentCondition(condition),
      policies: presentPolicies(user, [condition]),
    };
  }
);

router.post(
  "conditions.update",
  auth(),
  validate(T.ConditionsUpdateSchema),
  transaction(),
  async (ctx: APIContext<T.ConditionsUpdateReq>) => {
    const { id, ...updates } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const condition = await Condition.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!condition || condition.teamId !== user.teamId) {
      ctx.throw(404);
    }
    authorize(user, "update", condition);

    if (updates.name) {
      (updates as Record<string, unknown>).slug = slugify(updates.name);
    }

    await condition!.update(updates, { transaction });

    ctx.body = {
      data: presentCondition(condition!),
      policies: presentPolicies(user, [condition!]),
    };
  }
);

router.post(
  "conditions.delete",
  auth(),
  validate(T.ConditionsDeleteSchema),
  transaction(),
  async (ctx: APIContext<T.ConditionsDeleteReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const condition = await Condition.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!condition || condition.teamId !== user.teamId) {
      ctx.throw(404);
    }
    authorize(user, "delete", condition);

    // Clean up backing documents linked to condition sections
    const sections = await ConditionSection.findAll({
      where: { conditionId: id },
      transaction,
    });

    const documentIds = sections
      .map((s) => s.documentId)
      .filter((did): did is string => !!did);

    if (documentIds.length > 0) {
      await Document.destroy({
        where: { id: documentIds },
        transaction,
      });
    }

    // Clean up the dedicated collection if it has no other documents
    const collectionId = condition!.collectionId;
    if (collectionId) {
      const otherDocCount = await Document.count({
        where: { collectionId },
        transaction,
        paranoid: true,
      });

      // Only delete if all remaining docs in the collection are the ones
      // we just soft-deleted (i.e., no other active documents)
      if (otherDocCount === 0) {
        await Collection.destroy({
          where: { id: collectionId },
          transaction,
        });
      }
    }

    await condition!.destroy({ transaction });

    ctx.body = {
      success: true,
    };
  }
);

export default router;
