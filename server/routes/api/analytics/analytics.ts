import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import validate from "@server/middlewares/validate";
import {
  Condition,
  ConditionIntervention,
  ConditionRecipe,
  ConditionSection,
  Intervention,
  EvidenceEntry,
  Scripture,
  Recipe,
  CareDomain,
} from "@server/models";
import type { APIContext } from "@server/types";
import * as T from "./schema";

const router = new Router();

router.post(
  "analytics.dashboard",
  auth(),
  validate(T.AnalyticsDashboardSchema),
  async (ctx: APIContext<T.AnalyticsDashboardReq>) => {
    const { user } = ctx.state.auth;
    const teamId = user.teamId;

    const [
      conditionCount,
      interventionCount,
      evidenceCount,
      scriptureCount,
      recipeCount,
      conditionsByStatus,
    ] = await Promise.all([
      Condition.count({ where: { teamId } }),
      Intervention.count({ where: { teamId } }),
      EvidenceEntry.count({ where: { teamId } }),
      Scripture.count({ where: { teamId } }),
      Recipe.count({ where: { teamId } }),
      Condition.count({
        where: { teamId },
        group: ["status"],
      }),
    ]);

    // Sequelize group count returns { status: string, count: string }
    const statusData = (
      conditionsByStatus as unknown as Array<{
        status: string;
        count: string;
      }>
    ).map((item) => ({
      status: item.status,
      count: Number(item.count),
    }));

    ctx.body = {
      data: {
        totals: {
          conditions: conditionCount,
          interventions: interventionCount,
          evidenceEntries: evidenceCount,
          scriptures: scriptureCount,
          recipes: recipeCount,
        },
        conditionsByStatus: statusData,
      },
    };
  }
);

router.post(
  "analytics.graph",
  auth(),
  validate(T.ConditionsGraphSchema),
  async (ctx: APIContext<T.ConditionsGraphReq>) => {
    const { user } = ctx.state.auth;
    const teamId = user.teamId;

    // Fetch all entities in parallel
    const [
      conditions,
      interventions,
      careDomains,
      sections,
      recipes,
      scriptures,
      evidenceEntries,
    ] = await Promise.all([
      Condition.findAll({
        where: { teamId },
        attributes: ["id", "name", "slug", "status", "snomedCode", "icdCode"],
      }),
      Intervention.findAll({
        where: { teamId },
        attributes: ["id", "name", "slug", "careDomainId", "category"],
      }),
      CareDomain.findAll({
        attributes: ["id", "name", "slug", "color", "icon"],
        order: [["sortOrder", "ASC"]],
      }),
      ConditionSection.findAll({
        attributes: [
          "id",
          "conditionId",
          "sectionType",
          "title",
          "sortOrder",
        ],
        order: [["sortOrder", "ASC"]],
      }),
      Recipe.findAll({
        where: { teamId },
        attributes: ["id", "name"],
      }),
      Scripture.findAll({
        where: { teamId },
        attributes: [
          "id",
          "reference",
          "conditionId",
          "interventionId",
          "spiritOfProphecy",
        ],
      }),
      EvidenceEntry.findAll({
        where: { teamId },
        attributes: ["id", "title", "conditionId", "interventionId"],
      }),
    ]);

    const conditionIds = conditions.map((c) => c.id);

    // Fetch junction tables
    const [ciLinks, crLinks] = await Promise.all([
      conditionIds.length > 0
        ? ConditionIntervention.findAll({
            where: { conditionId: conditionIds },
            attributes: [
              "conditionId",
              "interventionId",
              "careDomainId",
              "evidenceLevel",
            ],
          })
        : Promise.resolve([]),
      conditionIds.length > 0
        ? ConditionRecipe.findAll({
            where: { conditionId: conditionIds },
            attributes: ["conditionId", "recipeId", "careDomainId"],
          })
        : Promise.resolve([]),
    ]);

    // Index lookups
    const domainById = new Map(careDomains.map((d) => [d.id, d]));
    const interventionById = new Map(interventions.map((i) => [i.id, i]));
    const recipeById = new Map(recipes.map((r) => [r.id, r]));

    // Group sections by conditionId
    const sectionsByCondition = new Map<
      string,
      Array<{ sectionType: string; title: string }>
    >();
    for (const section of sections) {
      const list = sectionsByCondition.get(section.conditionId) ?? [];
      list.push({
        sectionType: section.sectionType,
        title: section.title,
      });
      sectionsByCondition.set(section.conditionId, list);
    }

    // Group intervention links by condition → care domain → interventions
    const interventionsByCondition = new Map<
      string,
      Map<
        string,
        Array<{ name: string; evidenceLevel: string | null }>
      >
    >();
    for (const link of ciLinks) {
      const intervention = interventionById.get(link.interventionId);
      if (!intervention) {
        continue;
      }
      const domainId =
        link.careDomainId ?? intervention.careDomainId ?? "uncategorized";
      const condMap =
        interventionsByCondition.get(link.conditionId) ?? new Map();
      const domainList = condMap.get(domainId) ?? [];
      domainList.push({
        name: intervention.name,
        evidenceLevel: link.evidenceLevel,
      });
      condMap.set(domainId, domainList);
      interventionsByCondition.set(link.conditionId, condMap);
    }

    // Group recipes by condition
    const recipesByCondition = new Map<string, string[]>();
    for (const link of crLinks) {
      const recipe = recipeById.get(link.recipeId);
      if (!recipe) {
        continue;
      }
      const list = recipesByCondition.get(link.conditionId) ?? [];
      list.push(recipe.name);
      recipesByCondition.set(link.conditionId, list);
    }

    // Group scriptures by condition
    const scripturesByCondition = new Map<
      string,
      Array<{ reference: string; spiritOfProphecy: boolean }>
    >();
    for (const s of scriptures) {
      if (!s.conditionId) {
        continue;
      }
      const list = scripturesByCondition.get(s.conditionId) ?? [];
      list.push({
        reference: s.reference,
        spiritOfProphecy: s.spiritOfProphecy,
      });
      scripturesByCondition.set(s.conditionId, list);
    }

    // Group evidence by condition
    const evidenceByCondition = new Map<string, string[]>();
    for (const e of evidenceEntries) {
      if (!e.conditionId) {
        continue;
      }
      const list = evidenceByCondition.get(e.conditionId) ?? [];
      list.push(e.title);
      evidenceByCondition.set(e.conditionId, list);
    }

    // Build condition-centric graph data
    const conditionGraphs = conditions.map((condition) => {
      const condSections = sectionsByCondition.get(condition.id) ?? [];
      const condInterventions =
        interventionsByCondition.get(condition.id) ?? new Map();

      // Interventions grouped by care domain
      const interventionGroups: Array<{
        careDomain: string;
        interventions: Array<{
          name: string;
          evidenceLevel: string | null;
        }>;
      }> = [];

      for (const [domainId, intList] of condInterventions) {
        const domain = domainById.get(domainId);
        interventionGroups.push({
          careDomain: domain?.name ?? "Uncategorized",
          interventions: intList,
        });
      }

      return {
        id: condition.id,
        name: condition.name,
        slug: condition.slug,
        status: condition.status,
        snomedCode: condition.snomedCode,
        icdCode: condition.icdCode,
        sections: condSections,
        interventionGroups,
        recipes: recipesByCondition.get(condition.id) ?? [],
        scriptures: scripturesByCondition.get(condition.id) ?? [],
        evidence: evidenceByCondition.get(condition.id) ?? [],
      };
    });

    ctx.body = {
      data: {
        conditions: conditionGraphs,
        careDomains: careDomains.map((d) => ({
          id: d.id,
          name: d.name,
          color: d.color,
          icon: d.icon,
        })),
        totals: {
          conditions: conditions.length,
          interventions: interventions.length,
          careDomains: careDomains.length,
          recipes: recipes.length,
          scriptures: scriptures.length,
          evidence: evidenceEntries.length,
        },
      },
    };
  }
);

export default router;
