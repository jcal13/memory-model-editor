/** Labels for the five authored study exercises; Tasks 3–5 use existing tools. */
export const studyTaskLabel = (id: number) =>
  ["Task 1", "Task 2a", "Task 2b", "Task 2c", "Task 2d"][id - 1] ?? `Study question ${id}`;
