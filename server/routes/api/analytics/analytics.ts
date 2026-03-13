import Router from "koa-router";
import { Op } from "sequelize";
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

    ctx.body = {
      data: {
        totals: {
          conditions: conditionCount,
          interventions: interventionCount,
          evidenceEntries: evidenceCount,
          scriptures: scriptureCount,
          recipes: recipeCount,
        },
        conditionsByStatus: conditionsByStatus as unknown as Array<{
          status: string;
          count: number;
        }>,
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

    const [conditions, interventions, careDomains] = await Promise.all([
      Condition.findAll({
        where: { teamId },
        attributes: ["id", "name", "slug", "status", "snomedCode"],
      }),
      Intervention.findAll({
        where: { teamId },
        attributes: ["id", "name", "slug", "careDomainId"],
      }),
      CareDomain.findAll({
        attributes: ["id", "name", "slug", "color", "icon"],
        order: [["sortOrder", "ASC"]],
      }),
    ]);

    // Build nodes
    const nodes: Array<{
      id: string;
      type: string;
      label: string;
      data: Record<string, unknown>;
    }> = [];

    const edges: Array<{
      id: string;
      source: string;
      target: string;
      label?: string;
    }> = [];

    // Care domain nodes
    for (const domain of careDomains) {
      nodes.push({
        id: `domain-${domain.id}`,
        type: "careDomain",
        label: domain.name,
        data: { color: domain.color, icon: domain.icon },
      });
    }

    // Condition nodes
    for (const condition of conditions) {
      nodes.push({
        id: `condition-${condition.id}`,
        type: "condition",
        label: condition.name,
        data: { status: condition.status, snomedCode: condition.snomedCode },
      });
    }

    // Intervention nodes + edges to care domains
    for (const intervention of interventions) {
      nodes.push({
        id: `intervention-${intervention.id}`,
        type: "intervention",
        label: intervention.name,
        data: { careDomainId: intervention.careDomainId },
      });

      if (intervention.careDomainId) {
        edges.push({
          id: `edge-int-domain-${intervention.id}`,
          source: `intervention-${intervention.id}`,
          target: `domain-${intervention.careDomainId}`,
          label: "belongs to",
        });
      }
    }

    // Condition-Intervention edges from the join table
    const ciLinks = await ConditionIntervention.findAll({
      attributes: ["conditionId", "interventionId", "evidenceLevel"],
    });

    for (const link of ciLinks) {
      edges.push({
        id: `edge-ci-${link.conditionId}-${link.interventionId}`,
        source: `condition-${link.conditionId}`,
        target: `intervention-${link.interventionId}`,
        label: link.evidenceLevel
          ? `Evidence: ${link.evidenceLevel}`
          : "treats",
      });
    }

    ctx.body = {
      data: { nodes, edges },
    };
  }
);

export default router;
