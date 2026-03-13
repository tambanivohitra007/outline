import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import validate from "@server/middlewares/validate";
import { Condition, ConditionSection } from "@server/models";
import { authorize } from "@server/policies";
import { presentConditionSection } from "@server/presenters";
import type { APIContext } from "@server/types";
import * as T from "./schema";

const router = new Router();

router.post(
  "conditionSections.list",
  auth(),
  validate(T.ConditionSectionsListSchema),
  async (ctx: APIContext<T.ConditionSectionsListReq>) => {
    const { conditionId } = ctx.input.body;
    const { user } = ctx.state.auth;

    const condition = await Condition.findByPk(conditionId);
    authorize(user, "read", condition);

    const sections = await ConditionSection.findAll({
      where: { conditionId },
      order: [["sortOrder", "ASC"]],
    });

    ctx.body = {
      data: sections.map(presentConditionSection),
    };
  }
);

export default router;
