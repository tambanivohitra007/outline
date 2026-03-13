import Router from "koa-router";
import slugify from "@shared/utils/slugify";
import auth from "@server/middlewares/authentication";
import { transaction } from "@server/middlewares/transaction";
import validate from "@server/middlewares/validate";
import { Condition, ConditionSection } from "@server/models";
import { authorize } from "@server/policies";
import {
  presentCondition,
  presentConditionSection,
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
    const { transaction } = ctx.state;
    const { name, snomedCode, icdCode, collectionId } = ctx.input.body;

    const condition = await Condition.create(
      {
        name,
        slug: slugify(name),
        snomedCode: snomedCode ?? null,
        icdCode: icdCode ?? null,
        collectionId: collectionId ?? null,
        teamId: user.teamId,
        createdById: user.id,
      },
      { transaction }
    );

    // Create default sections
    const defaultSections = [
      { sectionType: "risk_factors" as const, title: "Risk Factors/Causes", sortOrder: 0 },
      { sectionType: "physiology" as const, title: "Relevant Physiology", sortOrder: 1 },
      { sectionType: "complications" as const, title: "Complications", sortOrder: 2 },
      { sectionType: "solutions" as const, title: "Solutions", sortOrder: 3 },
      { sectionType: "bible_sop" as const, title: "Bible & Spirit of Prophecy", sortOrder: 4 },
      { sectionType: "research_ideas" as const, title: "Ideas for Potential Research", sortOrder: 5 },
    ];

    await Promise.all(
      defaultSections.map((section) =>
        ConditionSection.create(
          {
            ...section,
            conditionId: condition.id,
          },
          { transaction }
        )
      )
    );

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
    authorize(user, "delete", condition);

    await condition!.destroy({ transaction });

    ctx.body = {
      success: true,
    };
  }
);

router.post(
  "conditions.sections",
  auth(),
  validate(T.ConditionsSectionsSchema),
  async (ctx: APIContext<T.ConditionsSectionsReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;

    const condition = await Condition.findByPk(id);
    authorize(user, "read", condition);

    const sections = await ConditionSection.findAll({
      where: { conditionId: id },
      order: [["sortOrder", "ASC"]],
    });

    ctx.body = {
      data: sections.map(presentConditionSection),
    };
  }
);

export default router;
