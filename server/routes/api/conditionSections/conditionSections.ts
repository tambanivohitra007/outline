import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import { transaction } from "@server/middlewares/transaction";
import validate from "@server/middlewares/validate";
import {
  Collection,
  Condition,
  ConditionSection,
  Document,
} from "@server/models";
import { DocumentHelper } from "@server/models/helpers/DocumentHelper";
import { ProsemirrorHelper } from "@server/models/helpers/ProsemirrorHelper";
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
    if (!condition || condition.teamId !== user.teamId) {
      ctx.throw(404);
    }
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

router.post(
  "conditionSections.createDocument",
  auth(),
  validate(T.ConditionSectionsCreateDocumentSchema),
  transaction(),
  async (ctx: APIContext<T.ConditionSectionsCreateDocumentReq>) => {
    const { id } = ctx.input.body;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    const section = await ConditionSection.findByPk(id, { transaction });
    if (!section) {
      ctx.throw(404, "Section not found");
      return;
    }

    const condition = await Condition.findByPk(section.conditionId, {
      transaction,
    });
    authorize(user, "update", condition);

    if (section.documentId) {
      ctx.body = {
        data: presentConditionSection(section),
      };
      return;
    }

    // Ensure condition has a collection
    let collectionId = condition!.collectionId;
    if (!collectionId) {
      const collection = Collection.build({
        name: condition!.name,
        description: `Treatment guide for ${condition!.name}`,
        teamId: user.teamId,
        createdById: user.id,
        permission: "read_write",
      });
      await collection.saveWithCtx(ctx);
      collectionId = collection.id;
      await condition!.update({ collectionId }, { transaction });
    }

    // Create a backing document
    const content = ProsemirrorHelper.toProsemirror("").toJSON();
    const document = Document.build({
      title: `${condition!.name} \u2014 ${section.title}`,
      content,
      collectionId,
      teamId: user.teamId,
      createdById: user.id,
      lastModifiedById: user.id,
    });

    document.text = await DocumentHelper.toMarkdown(document, {
      includeTitle: false,
    });
    await document.saveWithCtx(ctx, { silent: true });
    await document.publish(ctx, {
      collectionId,
      silent: true,
      event: false,
    });

    // Link it to the section
    await section.update({ documentId: document.id }, { transaction });

    ctx.body = {
      data: presentConditionSection(section),
    };
  }
);

export default router;
