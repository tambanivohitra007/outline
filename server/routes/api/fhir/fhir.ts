import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import validate from "@server/middlewares/validate";
import { Condition, Intervention } from "@server/models";
import { authorize } from "@server/policies";
import FHIRExporter from "@server/services/fhir/FHIRExporter";
import type { APIContext } from "@server/types";
import * as T from "./schema";

const router = new Router();

router.post(
  "fhir.exportCondition",
  auth(),
  validate(T.FHIRExportConditionSchema),
  async (ctx: APIContext<T.FHIRExportConditionReq>) => {
    const { conditionId } = ctx.input.body;
    const { user } = ctx.state.auth;

    const condition = await Condition.findByPk(conditionId);
    authorize(user, "read", condition);

    const resource = FHIRExporter.conditionToFHIR(condition!);

    ctx.body = {
      data: resource,
    };
  }
);

router.post(
  "fhir.exportBundle",
  auth(),
  validate(T.FHIRExportBundleSchema),
  async (ctx: APIContext<T.FHIRExportBundleReq>) => {
    const { conditionIds, interventionIds } = ctx.input.body;
    const { user } = ctx.state.auth;

    const resources = [];

    if (conditionIds && conditionIds.length > 0) {
      const conditions = await Condition.findAll({
        where: { id: conditionIds, teamId: user.teamId },
      });
      for (const condition of conditions) {
        resources.push(FHIRExporter.conditionToFHIR(condition));
      }
    }

    if (interventionIds && interventionIds.length > 0) {
      const interventions = await Intervention.findAll({
        where: { id: interventionIds, teamId: user.teamId },
      });
      for (const intervention of interventions) {
        resources.push(FHIRExporter.interventionToFHIR(intervention));
      }
    }

    const bundle = FHIRExporter.createBundle(resources);

    ctx.body = {
      data: bundle,
    };
  }
);

export default router;
