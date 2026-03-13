import Router from "koa-router";
import slugify from "@shared/utils/slugify";
import auth from "@server/middlewares/authentication";
import { transaction } from "@server/middlewares/transaction";
import validate from "@server/middlewares/validate";
import { Recipe } from "@server/models";
import { authorize } from "@server/policies";
import { presentRecipe, presentPolicies } from "@server/presenters";
import type { APIContext } from "@server/types";
import pagination from "../middlewares/pagination";
import * as T from "./schema";

const router = new Router();

router.post(
  "recipes.list",
  auth(),
  pagination(),
  validate(T.RecipesListSchema),
  async (ctx: APIContext<T.RecipesListReq>) => {
    const { user } = ctx.state.auth;

    const recipes = await Recipe.findAll({
      where: { teamId: user.teamId },
      order: [["name", "ASC"]],
      offset: ctx.state.pagination.offset,
      limit: ctx.state.pagination.limit,
    });

    ctx.body = {
      pagination: ctx.state.pagination,
      data: recipes.map(presentRecipe),
      policies: presentPolicies(user, recipes),
    };
  }
);

router.post(
  "recipes.info",
  auth(),
  validate(T.RecipesInfoSchema),
  async (ctx: APIContext<T.RecipesInfoReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;

    const recipe = await Recipe.findByPk(id);
    authorize(user, "read", recipe);

    ctx.body = {
      data: presentRecipe(recipe!),
      policies: presentPolicies(user, [recipe!]),
    };
  }
);

router.post(
  "recipes.create",
  auth(),
  validate(T.RecipesCreateSchema),
  transaction(),
  async (ctx: APIContext<T.RecipesCreateReq>) => {
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;
    const { name, ...rest } = ctx.input.body;

    const recipe = await Recipe.create(
      {
        name,
        slug: slugify(name),
        ...rest,
        teamId: user.teamId,
        createdById: user.id,
      },
      { transaction }
    );

    ctx.body = {
      data: presentRecipe(recipe),
      policies: presentPolicies(user, [recipe]),
    };
  }
);

router.post(
  "recipes.update",
  auth(),
  validate(T.RecipesUpdateSchema),
  transaction(),
  async (ctx: APIContext<T.RecipesUpdateReq>) => {
    const { id, ...updates } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const recipe = await Recipe.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    authorize(user, "update", recipe);

    if (updates.name) {
      (updates as Record<string, unknown>).slug = slugify(updates.name);
    }

    await recipe!.update(updates, { transaction });

    ctx.body = {
      data: presentRecipe(recipe!),
      policies: presentPolicies(user, [recipe!]),
    };
  }
);

router.post(
  "recipes.delete",
  auth(),
  validate(T.RecipesDeleteSchema),
  transaction(),
  async (ctx: APIContext<T.RecipesDeleteReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const recipe = await Recipe.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    authorize(user, "delete", recipe);

    await recipe!.destroy({ transaction });

    ctx.body = {
      success: true,
    };
  }
);

export default router;
