import { CollectionPermission } from "@shared/types";
import slugify from "@shared/utils/slugify";
import documentCreator from "@server/commands/documentCreator";
import {
  Collection,
  Condition,
  ConditionSection,
} from "@server/models";
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
    icon: "warning",
  },
  {
    sectionType: "physiology" as const,
    title: "Relevant Physiology",
    sortOrder: 1,
    icon: "beaker",
  },
  {
    sectionType: "complications" as const,
    title: "Complications",
    sortOrder: 2,
    icon: "flame",
  },
  {
    sectionType: "solutions" as const,
    title: "Solutions",
    sortOrder: 3,
    icon: "done",
  },
  {
    sectionType: "bible_sop" as const,
    title: "Bible & Spirit of Prophecy",
    sortOrder: 4,
    icon: "book",
  },
  {
    sectionType: "research_ideas" as const,
    title: "Ideas for Potential Research",
    sortOrder: 5,
    icon: "lightbulb",
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
    const collection = await Collection.createWithCtx(ctx, {
      name,
      icon: "kit-medical",
      description: `Treatment guide for ${name}`,
      teamId: user.teamId,
      createdById: user.id,
      sort: Collection.DEFAULT_SORT,
      permission: CollectionPermission.ReadWrite,
    });
    resolvedCollectionId = collection.id;
  }

  // Create the condition
  const condition = await Condition.create(
    {
      name,
      slug: slugify(name),
      snomedCode: snomedCode ?? null,
      icdCode: icdCode ?? null,
      status: "draft",
      collectionId: resolvedCollectionId,
      teamId: user.teamId,
      createdById: user.id,
    },
    { transaction }
  );

  // Create a backing Document + ConditionSection for each default section
  for (const sectionDef of DEFAULT_SECTIONS) {
    const document = await documentCreator(ctx, {
      title: `${name} \u2014 ${sectionDef.title}`,
      collectionId: resolvedCollectionId,
      icon: sectionDef.icon,
      publish: true,
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
