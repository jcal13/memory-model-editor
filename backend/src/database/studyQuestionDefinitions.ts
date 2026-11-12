import studyQuestions from "./studyQuestions.json";

export { studyQuestions };
export const findStudyQuestion = (id: number) => studyQuestions.find(q => q.id === id);

/** Reuse the source code and answer; study tasks check the final state only. */
export function withStudyQuestion<T extends object>(source: T, study: typeof studyQuestions[number]):
  Omit<T, "id" | "title" | "question" | "canvasConfig" | "steps"> & {
    id: number; title: string; question: string;
    canvasConfig: typeof study.canvasConfig; steps: null;
  } {
  return { ...source, id: study.id, title: study.title, question: study.question,
    canvasConfig: study.canvasConfig, steps: null };
}
