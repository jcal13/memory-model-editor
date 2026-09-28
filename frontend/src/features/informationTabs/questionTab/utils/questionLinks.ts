export const questionTypes = ["practice", "test", "prep", "experiment"] as const;
export interface QuestionLink {
  type: typeof questionTypes[number];
  id: number;
}

/** Query links also work on hosts without client-side route rewrites. */
export function readQuestionLink(search: string): QuestionLink | null {
  const params = new URLSearchParams(search);
  const types = questionTypes.filter(type => params.has(type));
  if (types.length !== 1) return null;
  const type = types[0];
  const values = params.getAll(type);
  if (values.length !== 1 || !/^[1-9]\d*$/.test(values[0])) return null;
  const id = Number(values[0]);
  return Number.isSafeInteger(id) ? { type, id } : null;
}

export function questionUrl(href: string, question: QuestionLink | null): string {
  const url = new URL(href);
  questionTypes.forEach(type => url.searchParams.delete(type));
  if (question) url.searchParams.set(question.type, String(question.id));
  return url.toString();
}
