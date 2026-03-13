import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import validate from "@server/middlewares/validate";
import GeminiService from "@server/services/ai/GeminiService";
import type { APIContext } from "@server/types";
import * as T from "./schema";

const router = new Router();

router.post(
  "ai.generateContent",
  auth(),
  validate(T.AIGenerateContentSchema),
  async (ctx: APIContext<T.AIGenerateContentReq>) => {
    const { conditionName, sectionType, existingContent, additionalContext } =
      ctx.input.body;

    const content = await GeminiService.generateContent({
      conditionName,
      sectionType,
      existingContent,
      additionalContext,
    });

    ctx.body = {
      data: {
        content,
        sectionType,
        conditionName,
      },
    };
  }
);

export default router;
