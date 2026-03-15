import Router from "koa-router";
import auth from "@server/middlewares/authentication";
import { transaction } from "@server/middlewares/transaction";
import validate from "@server/middlewares/validate";
import { EvidenceEntry } from "@server/models";
import BibleService from "@server/services/medical/BibleService";
import ClinicalTrialsService from "@server/services/medical/ClinicalTrialsService";
import EgwService from "@server/services/medical/EgwService";
import PubMedService from "@server/services/medical/PubMedService";
import SnomedService from "@server/services/medical/SnomedService";
import type { APIContext } from "@server/types";
import * as T from "./schema";

const router = new Router();

// SNOMED CT

router.post(
  "medical.snomed.search",
  auth(),
  validate(T.MedicalSnomedSearchSchema),
  async (ctx: APIContext<T.MedicalSnomedSearchReq>) => {
    const { term, limit } = ctx.input.body;
    const results = await SnomedService.search(term, limit);

    ctx.body = {
      data: results,
    };
  }
);

router.post(
  "medical.snomed.lookup",
  auth(),
  validate(T.MedicalSnomedLookupSchema),
  async (ctx: APIContext<T.MedicalSnomedLookupReq>) => {
    const { conceptId } = ctx.input.body;
    const result = await SnomedService.lookup(conceptId);

    ctx.body = {
      data: result,
    };
  }
);

// PubMed

router.post(
  "medical.pubmed.search",
  auth(),
  validate(T.MedicalPubmedSearchSchema),
  async (ctx: APIContext<T.MedicalPubmedSearchReq>) => {
    const { query, limit } = ctx.input.body;
    const results = await PubMedService.search(query, limit);

    ctx.body = {
      data: results,
    };
  }
);

router.post(
  "medical.pubmed.import",
  auth(),
  validate(T.MedicalPubmedImportSchema),
  transaction(),
  async (ctx: APIContext<T.MedicalPubmedImportReq>) => {
    const { user } = ctx.state.auth;
    const { pmid, conditionId, interventionId } = ctx.input.body;
    const { transaction } = ctx.state;

    const article = await PubMedService.fetchArticle(pmid);

    if (!article) {
      ctx.throw(404, "PubMed article not found");
      return;
    }

    const entry = await EvidenceEntry.create(
      {
        title: article.title,
        pubmedId: article.pmid,
        doi: article.doi,
        authors: article.authors,
        journal: article.journal,
        publicationDate: article.publicationDate
          ? new Date(article.publicationDate)
          : null,
        abstract: article.abstract,
        url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
        conditionId: conditionId ?? null,
        interventionId: interventionId ?? null,
        teamId: user.teamId,
        createdById: user.id,
      },
      { transaction }
    );

    ctx.body = {
      data: entry,
    };
  }
);

// ClinicalTrials.gov

router.post(
  "medical.clinicalTrials.search",
  auth(),
  validate(T.MedicalClinicalTrialsSearchSchema),
  async (ctx: APIContext<T.MedicalClinicalTrialsSearchReq>) => {
    const { query, limit } = ctx.input.body;
    const results = await ClinicalTrialsService.search(query, limit);

    ctx.body = {
      data: results,
    };
  }
);

// Bible

router.post(
  "medical.bible.search",
  auth(),
  validate(T.MedicalBibleSearchSchema),
  async (ctx: APIContext<T.MedicalBibleSearchReq>) => {
    const { query, translation, limit } = ctx.input.body;
    const results = await BibleService.search(query, translation, limit);

    ctx.body = {
      data: results,
    };
  }
);

router.post(
  "medical.bible.lookup",
  auth(),
  validate(T.MedicalBibleLookupSchema),
  async (ctx: APIContext<T.MedicalBibleLookupReq>) => {
    const { reference, translation } = ctx.input.body;
    const result = await BibleService.getVerse(reference, translation);

    ctx.body = {
      data: result,
    };
  }
);

// Bible chapter

router.post(
  "medical.bible.chapter",
  auth(),
  validate(T.MedicalBibleChapterSchema),
  async (ctx: APIContext<T.MedicalBibleChapterReq>) => {
    const { chapterId, translation } = ctx.input.body;
    const result = await BibleService.getChapter(chapterId, translation);

    ctx.body = {
      data: result,
    };
  }
);

// Bible translations

router.post(
  "medical.bible.translations",
  auth(),
  validate(T.MedicalBibleTranslationsSchema),
  async (ctx: APIContext<T.MedicalBibleTranslationsReq>) => {
    const { language } = ctx.input.body;
    const results = await BibleService.listTranslations(language);

    ctx.body = {
      data: results,
    };
  }
);

// EGW (Ellen G. White) Writings

router.post(
  "medical.egw.search",
  auth(),
  validate(T.MedicalEgwSearchSchema),
  async (ctx: APIContext<T.MedicalEgwSearchReq>) => {
    const { query, limit, lang } = ctx.input.body;
    const results = await EgwService.search(query, limit, lang);

    ctx.body = {
      data: results,
    };
  }
);

router.post(
  "medical.egw.books",
  auth(),
  validate(T.MedicalEgwBooksSchema),
  async (ctx: APIContext<T.MedicalEgwBooksReq>) => {
    const { search, lang } = ctx.input.body;
    const results = await EgwService.listBooks(search, lang);

    ctx.body = {
      data: results,
    };
  }
);

router.post(
  "medical.egw.toc",
  auth(),
  validate(T.MedicalEgwTocSchema),
  async (ctx: APIContext<T.MedicalEgwTocReq>) => {
    const { bookId } = ctx.input.body;
    const results = await EgwService.getBookToc(bookId);

    ctx.body = {
      data: results,
    };
  }
);

router.post(
  "medical.egw.content",
  auth(),
  validate(T.MedicalEgwContentSchema),
  async (ctx: APIContext<T.MedicalEgwContentReq>) => {
    const { bookId, paraId } = ctx.input.body;
    const results = await EgwService.getContent(bookId, paraId);

    ctx.body = {
      data: results,
    };
  }
);

export default router;
