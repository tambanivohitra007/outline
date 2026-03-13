import slugify from "@shared/utils/slugify";
import {
  Collection,
  Condition,
  ConditionSection,
  Document,
} from "@server/models";
import { DocumentHelper } from "@server/models/helpers/DocumentHelper";
import { ProsemirrorHelper } from "@server/models/helpers/ProsemirrorHelper";
import type { APIContext } from "@server/types";

interface Props {
  name: string;
  snomedCode?: string | null;
  icdCode?: string | null;
  collectionId?: string | null;
}

const DEFAULT_SECTIONS = [
  {
    sectionType: "risk_factors" as const,
    title: "Risk Factors/Causes",
    sortOrder: 0,
  },
  {
    sectionType: "physiology" as const,
    title: "Relevant Physiology",
    sortOrder: 1,
  },
  {
    sectionType: "complications" as const,
    title: "Complications",
    sortOrder: 2,
  },
  {
    sectionType: "solutions" as const,
    title: "Solutions",
    sortOrder: 3,
  },
  {
    sectionType: "bible_sop" as const,
    title: "Bible & Spirit of Prophecy",
    sortOrder: 4,
  },
  {
    sectionType: "research_ideas" as const,
    title: "Ideas for Potential Research",
    sortOrder: 5,
  },
];

/**
 * Create a Condition with a backing Collection and Documents for each section.
 *
 * @param ctx The API context (includes user, transaction).
 * @param props The condition properties.
 * @returns The created Condition with sections.
 */
export default async function conditionCreator(
  ctx: APIContext,
  { name, snomedCode, icdCode, collectionId }: Props
): Promise<Condition> {
  const { user } = ctx.state.auth;
  const { transaction } = ctx.state;

  // If no collectionId provided, create a dedicated collection for this condition
  let resolvedCollectionId = collectionId ?? null;

  if (!resolvedCollectionId) {
    const collection = Collection.build({
      name,
      description: `Treatment guide for ${name}`,
      teamId: user.teamId,
      createdById: user.id,
      permission: "read_write",
    });
    await collection.saveWithCtx(ctx);
    resolvedCollectionId = collection.id;
  }

  // Create the condition
  const condition = await Condition.create(
    {
      name,
      slug: slugify(name),
      snomedCode: snomedCode ?? null,
      icdCode: icdCode ?? null,
      collectionId: resolvedCollectionId,
      teamId: user.teamId,
      createdById: user.id,
    },
    { transaction }
  );

  // Create a backing Document + ConditionSection for each default section
  for (const sectionDef of DEFAULT_SECTIONS) {
    const content = ProsemirrorHelper.toProsemirror("").toJSON();
    const document = Document.build({
      title: `${name} — ${sectionDef.title}`,
      content,
      collectionId: resolvedCollectionId,
      teamId: user.teamId,
      createdById: user.id,
      lastModifiedById: user.id,
    });

    document.text = await DocumentHelper.toMarkdown(document, {
      includeTitle: false,
    });
    await document.saveWithCtx(ctx, { silent: true });

    // Publish the document into the collection
    await document.publish(ctx, {
      collectionId: resolvedCollectionId,
      silent: true,
      event: false,
    });

    await ConditionSection.create(
      {
        conditionId: condition.id,
        sectionType: sectionDef.sectionType,
        title: sectionDef.title,
        sortOrder: sectionDef.sortOrder,
        documentId: document.id,
      },
      { transaction }
    );
  }

  return condition;
}
