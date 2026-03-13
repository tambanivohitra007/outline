import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import validate from "@server/middlewares/validate";
import { CareDomain } from "@server/models";
import { presentCareDomain } from "@server/presenters";
import type { APIContext } from "@server/types";
import * as T from "./schema";

const router = new Router();

router.post(
  "careDomains.list",
  auth(),
  validate(T.CareDomainsListSchema),
  async (ctx: APIContext<T.CareDomainsListReq>) => {
    const careDomains = await CareDomain.findAll({
      order: [["sortOrder", "ASC"]],
    });

    ctx.body = {
      data: careDomains.map(presentCareDomain),
    };
  }
);

export default router;
