import path from "node:path";
import { readFile } from "fs-extra";
import { CollectionPermission } from "@shared/types";
import Logger from "@server/logging/Logger";
import { Collection, Document } from "@server/models";
import { DocumentHelper } from "@server/models/helpers/DocumentHelper";
import type { APIContext } from "@server/types";
import type { Team, User } from "@server/models";

/** Display title (used in the collection and as document titles) mapped to file name on disk. */
const HELP_DOCS = [
  "01 Welcome to Lifestyle Medicine",
  "02 Getting Started",
  "03 Conditions",
  "04 Sections and Documents",
  "05 Interventions and Care Domains",
  "06 Evidence and References",
  "07 Collaboration Workflow",
  "08 AI Features",
  "09 Administration",
  "10 Recipes",
  "11 FHIR Export",
];

/**
 * Seed a read-only "Help & Documentation" collection for a team.
 *
 * Each document is sourced from the markdown files in `server/help/`.
 * The collection uses `CollectionPermission.Read` so that non-admin
 * members can read but not modify the guides.
 *
 * This function is idempotent — if a collection named
 * "Help & Documentation" already exists for the team it returns early.
 *
 * @param ctx - The API context (includes user and transaction).
 * @param team - The team to seed the help collection for.
 * @param user - The user who will be recorded as the creator.
 * @returns The created (or existing) Collection, or null if skipped.
 */
export default async function helpCollectionSeeder(
  ctx: APIContext,
  team: Team,
  user: User
): Promise<Collection | null> {
  const { transaction } = ctx.state;

  // Idempotency: skip if this team already has the help collection
  const existing = await Collection.findOne({
    where: { teamId: team.id, name: "Help & Documentation" },
    transaction,
  });

  if (existing) {
    return existing;
  }

  const collection = await Collection.createWithCtx(ctx, {
    name: "Help & Documentation",
    description:
      "Guides and references for using the Lifestyle Medicine knowledge base. This collection is managed by the system.",
    icon: "question",
    teamId: team.id,
    createdById: user.id,
    sort: Collection.DEFAULT_SORT,
    permission: CollectionPermission.Read,
  });

  const helpDir = path.join(process.cwd(), "server", "help");

  for (const fileName of HELP_DOCS) {
    // Strip the "01 " prefix for the document title
    const title = fileName.replace(/^\d+\s+/, "");

    let text: string;
    try {
      text = await readFile(path.join(helpDir, `${fileName}.md`), "utf8");
    } catch (err) {
      Logger.warn(
        "helpCollectionSeeder",
        `Missing help file: ${fileName}.md`,
        err
      );
      continue;
    }

    const document = await Document.createWithCtx(ctx, {
      version: 2,
      parentDocumentId: null,
      collectionId: collection.id,
      teamId: team.id,
      lastModifiedById: user.id,
      createdById: user.id,
      title,
      text,
    });

    document.content = await DocumentHelper.toJSON(document);

    await document.publish(ctx, {
      collectionId: collection.id,
      silent: true,
    });
  }

  Logger.info(
    "helpCollectionSeeder",
    `Seeded Help & Documentation collection for team ${team.name}`
  );

  return collection;
}
