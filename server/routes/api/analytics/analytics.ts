import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import validate from "@server/middlewares/validate";
import {
  Condition,
  ConditionIntervention,
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

    const [conditions, interventions, careDomains, sections] =
      await Promise.all([
        Condition.findAll({
          where: { teamId },
          attributes: ["id", "name", "slug", "status", "snomedCode"],
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
          where: {},
          attributes: [
            "id",
            "conditionId",
            "sectionType",
            "title",
            "sortOrder",
          ],
          order: [["sortOrder", "ASC"]],
        }),
      ]);

    // Index care domains by id
    const domainById = new Map(careDomains.map((d) => [d.id, d]));

    // Index interventions by id
    const interventionById = new Map(interventions.map((i) => [i.id, i]));

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

    // Get condition-intervention links
    const conditionIds = conditions.map((c) => c.id);
    const ciLinks =
      conditionIds.length > 0
        ? await ConditionIntervention.findAll({
            where: { conditionId: conditionIds },
            attributes: [
              "conditionId",
              "interventionId",
              "careDomainId",
              "evidenceLevel",
            ],
          })
        : [];

    // Group intervention links by condition, then by care domain
    const interventionsByCondition = new Map<
      string,
      Map<
        string,
        Array<{ interventionName: string; evidenceLevel: string | null }>
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
        interventionName: intervention.name,
        evidenceLevel: link.evidenceLevel,
      });
      condMap.set(domainId, domainList);
      interventionsByCondition.set(link.conditionId, condMap);
    }

    // Build condition-centric graph data
    const conditionGraphs = conditions.map((condition) => {
      const condSections = sectionsByCondition.get(condition.id) ?? [];
      const condInterventions =
        interventionsByCondition.get(condition.id) ?? new Map();

      // Build interventions grouped by care domain
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
        sections: condSections,
        interventionGroups,
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
          links: ciLinks.length,
        },
      },
    };
  }
);

export default router;
