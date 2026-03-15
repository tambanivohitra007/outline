import { Op } from "sequelize";
import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import validate from "@server/middlewares/validate";
import {
  Condition,
  ConditionSection,
  Document,
  Intervention,
  Recipe,
} from "@server/models";
import {
  presentCondition,
  presentIntervention,
  presentRecipe,
} from "@server/presenters";
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

router.post(
  "ai.search",
  auth(),
  validate(T.AISearchSchema),
  async (ctx: APIContext<T.AISearchReq>) => {
    const { query } = ctx.input.body;
    const { user } = ctx.state.auth;
    const teamId = user.teamId;

    // Use Gemini to interpret the search query
    const searchParams = await GeminiService.interpretSearch(query);

    // Build OR conditions for each entity type
    const allTerms = [
      ...searchParams.keywords,
      ...searchParams.conditionTerms,
      ...searchParams.interventionTerms,
      ...searchParams.recipeTerms,
    ];

    const likeConditions = allTerms.map((term) => ({
      [Op.iLike]: `%${term}%`,
    }));

    // Search conditions
    const conditions =
      searchParams.conditionTerms.length > 0 || searchParams.keywords.length > 0
        ? await Condition.findAll({
            where: {
              teamId,
              [Op.or]: [
                { name: { [Op.or]: likeConditions } },
              ],
            },
            limit: 10,
          })
        : [];

    // Search interventions
    const interventions =
      searchParams.interventionTerms.length > 0 || searchParams.keywords.length > 0
        ? await Intervention.findAll({
            where: {
              teamId,
              [Op.or]: [
                { name: { [Op.or]: likeConditions } },
                { category: { [Op.or]: likeConditions } },
              ],
            },
            limit: 10,
          })
        : [];

    // Search recipes
    const recipes =
      searchParams.recipeTerms.length > 0 || searchParams.keywords.length > 0
        ? await Recipe.findAll({
            where: {
              teamId,
              [Op.or]: [
                { name: { [Op.or]: likeConditions } },
                { description: { [Op.or]: likeConditions } },
              ],
            },
            limit: 10,
          })
        : [];

    ctx.body = {
      data: {
        intent: searchParams.intent,
        conditions: conditions.map(presentCondition),
        interventions: interventions.map(presentIntervention),
        recipes: recipes.map(presentRecipe),
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

    // Gather existing data for context
    const sections = await ConditionSection.findAll({
      where: { conditionId },
    });

    const existingData = sections
      .map((s) => `- ${s.title} (${s.sectionType})`)
      .join("\n");

    const suggestions = await GeminiService.generateSuggestions(
      condition!.name,
      sectionType,
      existingData
    );

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

    // Gather section data with document content summaries
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

    const summary = await GeminiService.summarizeForReview(
      condition!.name,
      sectionSummaries.join("\n")
    );

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
