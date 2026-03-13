import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import { transaction } from "@server/middlewares/transaction";
import validate from "@server/middlewares/validate";
import { EvidenceEntry } from "@server/models";
import { authorize } from "@server/policies";
import { presentEvidenceEntry, presentPolicies } from "@server/presenters";
import type { APIContext } from "@server/types";
import pagination from "../middlewares/pagination";
import * as T from "./schema";

const router = new Router();

router.post(
  "evidenceEntries.list",
  auth(),
  pagination(),
  validate(T.EvidenceEntriesListSchema),
  async (ctx: APIContext<T.EvidenceEntriesListReq>) => {
    const { user } = ctx.state.auth;
    const { conditionId, interventionId } = ctx.input.body;

    const where: Record<string, unknown> = { teamId: user.teamId };
    if (conditionId) {
      where.conditionId = conditionId;
    }
    if (interventionId) {
      where.interventionId = interventionId;
    }

    const entries = await EvidenceEntry.findAll({
      where,
      order: [["createdAt", "DESC"]],
      offset: ctx.state.pagination.offset,
      limit: ctx.state.pagination.limit,
    });

    ctx.body = {
      pagination: ctx.state.pagination,
      data: entries.map(presentEvidenceEntry),
      policies: presentPolicies(user, entries),
    };
  }
);

router.post(
  "evidenceEntries.create",
  auth(),
  validate(T.EvidenceEntriesCreateSchema),
  transaction(),
  async (ctx: APIContext<T.EvidenceEntriesCreateReq>) => {
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const entry = await EvidenceEntry.create(
      {
        ...ctx.input.body,
        teamId: user.teamId,
        createdById: user.id,
      },
      { transaction }
    );

    ctx.body = {
      data: presentEvidenceEntry(entry),
      policies: presentPolicies(user, [entry]),
    };
  }
);

router.post(
  "evidenceEntries.update",
  auth(),
  validate(T.EvidenceEntriesUpdateSchema),
  transaction(),
  async (ctx: APIContext<T.EvidenceEntriesUpdateReq>) => {
    const { id, ...updates } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const entry = await EvidenceEntry.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    authorize(user, "update", entry);

    await entry!.update(updates, { transaction });

    ctx.body = {
      data: presentEvidenceEntry(entry!),
      policies: presentPolicies(user, [entry!]),
    };
  }
);

router.post(
  "evidenceEntries.delete",
  auth(),
  validate(T.EvidenceEntriesDeleteSchema),
  transaction(),
  async (ctx: APIContext<T.EvidenceEntriesDeleteReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const entry = await EvidenceEntry.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    authorize(user, "delete", entry);

    await entry!.destroy({ transaction });

    ctx.body = {
      success: true,
    };
  }
);

export default router;
