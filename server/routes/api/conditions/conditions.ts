import Router from "koa-router";
import slugify from "@shared/utils/slugify";
import auth from "@server/middlewares/authentication";
import { transaction } from "@server/middlewares/transaction";
import validate from "@server/middlewares/validate";
import conditionCreator from "@server/commands/conditionCreator";
import {
  CareDomain,
  Collection,
  Condition,
  ConditionIntervention,
  ConditionSection,
  Document,
  EvidenceEntry,
  Intervention,
  Scripture,
} from "@server/models";
import { DocumentHelper } from "@server/models/helpers/DocumentHelper";
import { authorize } from "@server/policies";
import {
  presentCondition,
  presentConditionIntervention,
  presentEvidenceEntry,
  presentIntervention,
  presentPolicies,
  presentScripture,
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
  "conditions.status",
  auth(),
  validate(T.ConditionsStatusSchema),
  transaction(),
  async (ctx: APIContext<T.ConditionsStatusReq>) => {
    const { id, status } = ctx.input.body;
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

    // Update condition status
    await condition!.update({ status }, { transaction });

    // Sync backing document publish state with condition status
    const sections = await ConditionSection.findAll({
      where: { conditionId: id },
      transaction,
    });

    const documentIds = sections
      .map((s) => s.documentId)
      .filter((did): did is string => !!did);

    if (documentIds.length > 0) {
      if (status === "published" || status === "review") {
        // Publish all section documents that are still drafts
        await Document.update(
          { publishedAt: new Date() },
          {
            where: { id: documentIds, publishedAt: null },
            transaction,
          }
        );
      } else if (status === "draft") {
        // Unpublish all section documents back to drafts
        await Document.update(
          { publishedAt: null },
          {
            where: { id: documentIds },
            transaction,
          }
        );
      }
    }

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

const SECTION_TYPE_TITLES: Record<string, string> = {
  risk_factors: "Risk Factors",
  physiology: "Physiology",
  complications: "Complications",
  solutions: "Solutions",
  bible_sop: "Bible & Spirit of Prophecy",
  research_ideas: "Research Ideas",
};

router.post(
  "conditions.compile",
  auth(),
  validate(T.ConditionsCompileSchema),
  async (ctx: APIContext<T.ConditionsCompileReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;

    const condition = await Condition.findByPk(id);
    if (!condition || condition.teamId !== user.teamId) {
      return ctx.throw(404);
    }
    authorize(user, "read", condition);

    // Fetch all related data in parallel
    const [sections, conditionInterventions, evidence, scriptures] =
      await Promise.all([
        ConditionSection.findAll({
          where: { conditionId: id },
          include: [{ model: Document, as: "document" }],
          order: [["sortOrder", "ASC"]],
        }),
        ConditionIntervention.findAll({
          where: { conditionId: id },
          include: [
            { model: Intervention, as: "intervention" },
            { model: CareDomain, as: "careDomain" },
          ],
          order: [["sortOrder", "ASC"]],
        }),
        EvidenceEntry.findAll({
          where: { conditionId: id },
          order: [["createdAt", "DESC"]],
        }),
        Scripture.findAll({
          where: { conditionId: id },
          order: [["createdAt", "DESC"]],
        }),
      ]);

    const compiledSections = await Promise.all(
      sections.map(async (section) => {
        let markdown = "";
        if (section.document) {
          markdown = await DocumentHelper.toMarkdown(section.document, {
            includeTitle: false,
          });
        }
        return {
          id: section.id,
          sectionType: section.sectionType,
          title: section.title || SECTION_TYPE_TITLES[section.sectionType] || section.sectionType,
          markdown,
        };
      })
    );

    // Build interventions with their linked data
    const interventionsData = conditionInterventions.map((ci) => ({
      ...presentConditionIntervention(ci),
      intervention: ci.intervention
        ? presentIntervention(ci.intervention)
        : null,
      careDomainName: ci.careDomain?.name ?? null,
    }));

    ctx.body = {
      data: {
        condition: presentCondition(condition),
        sections: compiledSections,
        interventions: interventionsData,
        evidence: evidence.map(presentEvidenceEntry),
        scriptures: scriptures.map(presentScripture),
      },
    };
  }
);

export default router;
