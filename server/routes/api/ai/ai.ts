import { Op } from "sequelize";
import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import validate from "@server/middlewares/validate";
import {
  Collection,
  Condition,
  ConditionSection,
  Document,
  Intervention,
  Recipe,
  Team,
} from "@server/models";
import {
  presentCondition,
  presentIntervention,
  presentRecipe,
} from "@server/presenters";
import { TeamPreference } from "@shared/types";
import { TeamPreferenceDefaults } from "@shared/constants";
import AIService from "@server/services/ai/AIService";
import GeminiService from "@server/services/ai/GeminiService";
import type { APIContext } from "@server/types";
import * as T from "./schema";

const router = new Router();

router.post(
  "ai.models",
  auth(),
  async (ctx: APIContext) => {
    ctx.body = {
      data: AIService.getAvailableModels(),
    };
  }
);

router.post(
  "ai.generateContent",
  auth(),
  validate(T.AIGenerateContentSchema),
  async (ctx: APIContext<T.AIGenerateContentReq>) => {
    const { conditionName, sectionType, existingContent, additionalContext } =
      ctx.input.body;
    const { user } = ctx.state.auth;

    const team = await Team.findByPk(user.teamId);
    const modelId =
      (team?.getPreference(TeamPreference.AIModel) as string) ??
      TeamPreferenceDefaults[TeamPreference.AIModel]!;

    const prompt = GeminiService.buildPromptPublic({
      conditionName,
      sectionType,
      existingContent,
      additionalContext,
    });

    const content = await AIService.generate(modelId, { prompt });

    ctx.body = {
      data: {
        content,
        sectionType,
        conditionName,
      },
    };
  }
);

router.post(
  "ai.search",
  auth(),
  validate(T.AISearchSchema),
  async (ctx: APIContext<T.AISearchReq>) => {
    const { query } = ctx.input.body;
    const { user } = ctx.state.auth;
    const teamId = user.teamId;

    // Direct database search — no AI dependency
    const likeQuery = { [Op.iLike]: `%${query}%` };

    const [conditions, interventions, recipes, documents, collections] =
      await Promise.all([
        Condition.findAll({
          where: {
            teamId,
            [Op.or]: [{ name: likeQuery }, { description: likeQuery }],
          },
          limit: 10,
        }),
        Intervention.findAll({
          where: {
            teamId,
            [Op.or]: [{ name: likeQuery }, { category: likeQuery }],
          },
          limit: 10,
        }),
        Recipe.findAll({
          where: {
            teamId,
            [Op.or]: [{ name: likeQuery }, { description: likeQuery }],
          },
          limit: 10,
        }),
        Document.unscoped().findAll({
          where: {
            teamId,
            [Op.or]: [{ title: likeQuery }, { text: likeQuery }],
            archivedAt: { [Op.is]: null },
            deletedAt: { [Op.is]: null },
          },
          attributes: ["id", "title", "urlId"],
          limit: 10,
          order: [["updatedAt", "DESC"]],
        }),
        Collection.findAll({
          where: {
            teamId,
            name: likeQuery,
          },
          attributes: ["id", "name", "urlId"],
          limit: 10,
        }),
      ]);

    ctx.body = {
      data: {
        conditions: conditions.map(presentCondition),
        interventions: interventions.map(presentIntervention),
        recipes: recipes.map(presentRecipe),
        documents: documents.map((d) => ({
          id: d.id,
          title: d.title,
          url: d.url,
        })),
        collections: collections.map((c) => ({
          id: c.id,
          name: c.name,
          url: `/collection/${c.urlId}`,
        })),
      },
    };
  }
);

router.post(
  "ai.suggest",
  auth(),
  validate(T.AISuggestSchema),
  async (ctx: APIContext<T.AISuggestReq>) => {
    const { conditionId, sectionType } = ctx.input.body;
    const { user } = ctx.state.auth;

    const condition = await Condition.findByPk(conditionId);
    if (!condition || condition.teamId !== user.teamId) {
      ctx.throw(404);
    }

    const team = await Team.findByPk(user.teamId);
    const modelId =
      (team?.getPreference(TeamPreference.AIModel) as string) ??
      TeamPreferenceDefaults[TeamPreference.AIModel]!;

    const sections = await ConditionSection.findAll({
      where: { conditionId },
    });

    const existingData = sections
      .map((s) => `- ${s.title} (${s.sectionType})`)
      .join("\n");

    const prompt = GeminiService.buildSuggestPrompt(
      condition!.name,
      sectionType,
      existingData
    );

    const suggestions = await AIService.generate(modelId, {
      prompt,
      temperature: 0.5,
    });

    ctx.body = {
      data: {
        suggestions,
        conditionName: condition!.name,
        sectionType,
      },
    };
  }
);

router.post(
  "ai.explain",
  auth(),
  validate(T.AIExplainSchema),
  async (ctx: APIContext<T.AIExplainReq>) => {
    const { topic, context } = ctx.input.body;
    const { user } = ctx.state.auth;

    const team = await Team.findByPk(user.teamId);
    const modelId =
      (team?.getPreference(TeamPreference.AIModel) as string) ??
      TeamPreferenceDefaults[TeamPreference.AIModel]!;

    const prompt = GeminiService.buildExplainPrompt(topic, context);
    const text = await AIService.generate(modelId, {
      prompt,
      temperature: 0.4,
    });

    ctx.body = {
      data: { text },
    };
  }
);

router.post(
  "ai.reviewSummary",
  auth(),
  validate(T.AIReviewSummarySchema),
  async (ctx: APIContext<T.AIReviewSummaryReq>) => {
    const { conditionId } = ctx.input.body;
    const { user } = ctx.state.auth;

    const condition = await Condition.findByPk(conditionId);
    if (!condition || condition.teamId !== user.teamId) {
      ctx.throw(404);
    }

    const team = await Team.findByPk(user.teamId);
    const modelId =
      (team?.getPreference(TeamPreference.AIModel) as string) ??
      TeamPreferenceDefaults[TeamPreference.AIModel]!;

    const sections = await ConditionSection.findAll({
      where: { conditionId },
      order: [["sortOrder", "ASC"]],
    });

    const sectionSummaries: string[] = [];
    for (const section of sections) {
      let contentStatus = "No document linked";
      if (section.documentId) {
        const doc = await Document.findByPk(section.documentId);
        if (doc) {
          const wordCount = doc.title ? doc.title.split(/\s+/).length : 0;
          const publishStatus = doc.publishedAt ? "Published" : "Draft";
          contentStatus = `${publishStatus}, ~${wordCount} words in title "${doc.title}"`;
        }
      }
      sectionSummaries.push(
        `- **${section.title}** (${section.sectionType}): ${contentStatus}`
      );
    }

    const prompt = GeminiService.buildReviewPrompt(
      condition!.name,
      sectionSummaries.join("\n")
    );

    const summary = await AIService.generate(modelId, {
      prompt,
      temperature: 0.3,
    });

    ctx.body = {
      data: {
        summary,
        conditionName: condition!.name,
        sectionCount: sections.length,
      },
    };
  }
);

export default router;
