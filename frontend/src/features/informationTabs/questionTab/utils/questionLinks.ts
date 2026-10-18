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

/** An empty value (including a bare key) opens the category list. */
export function readCategoryLink(search: string) {
  const params = new URLSearchParams(search);
  const types = questionTypes.filter(type => params.has(type));
  return types.length === 1 && params.getAll(types[0]).length === 1 && params.get(types[0]) === ""
    ? types[0] : null;
}

export function invalidQuestionLink(search: string) {
  const params = new URLSearchParams(search);
  return questionTypes.some(type => params.has(type)) && !readQuestionLink(search) && !readCategoryLink(search);
}

export function categoryUrl(href: string, type: typeof questionTypes[number]) {
  const url = new URL(questionUrl(href, null));
  const search = url.searchParams.toString();
  url.search = search ? `${search}&${type}` : type;
  return url.toString();
}
