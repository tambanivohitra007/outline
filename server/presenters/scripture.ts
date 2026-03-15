import type { Scripture } from "@server/models";

export default function presentScripture(scripture: Scripture) {
  return {
    id: scripture.id,
    reference: scripture.reference,
    text: scripture.text,
    book: scripture.book,
    chapter: scripture.chapter,
    verseStart: scripture.verseStart,
    verseEnd: scripture.verseEnd,
    translation: scripture.translation,
    theme: scripture.theme,
    spiritOfProphecy: scripture.spiritOfProphecy,
    sopSource: scripture.sopSource,
    sopPage: scripture.sopPage,
    careDomainId: scripture.careDomainId,
    conditionId: scripture.conditionId,
    interventionId: scripture.interventionId,
    teamId: scripture.teamId,
    createdAt: scripture.createdAt,
    updatedAt: scripture.updatedAt,
  };
}
