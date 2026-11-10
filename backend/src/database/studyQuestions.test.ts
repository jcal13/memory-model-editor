const mockQuery = jest.fn();
jest.mock("pg", () => ({ Pool: jest.fn(() => ({ query: mockQuery })) }));
import { studyQuestions, withStudyQuestion } from "./studyQuestionDefinitions";
import practiceQuestions from "./practiceQuestions.json";
import validateAnswer from "../features/validationServices/validateAnswer";

// Model sent by the existing canvas serializer for these frame/list/int fixtures.
function modelFor(study: typeof studyQuestions[number]): any[] {
  return study.canvasConfig.elements.map((element: any) => {
    const k = element.kind;
    return k.name === "function"
      ? { id: null, type: ".frame", name: k.functionName, order: k.order,
          value: Object.fromEntries(k.params.map((p: any) => [p.name, p.targetId])) }
      : { id: element.id, type: k.type, value: k.type === "int" ? Number(k.value) : [...k.value] };
  });
}
beforeEach(() => {
  mockQuery.mockReset();
  process.env.DATABASE_URL = "postgres://example.test/memory-model-editor";
});
it("keeps source question data unchanged while composing every study exercise", () => {
  const before = JSON.stringify(practiceQuestions);
  expect(studyQuestions.map(q => q.sourceQuestionId)).toEqual([7, 1, 8, 2, 4]);
  for (const study of studyQuestions) {
    const source = practiceQuestions.find(q => q.id === study.sourceQuestionId)!;
    const result = withStudyQuestion(source, study);
    expect(result.answer).toBe(source.answer);
    expect(result.code).toBe(source.code);
    expect(result.canvasConfig).toEqual(study.canvasConfig);
    expect(result.steps).toBeNull();
  }
  expect(JSON.stringify(practiceQuestions)).toBe(before);
});
it.each(studyQuestions.slice(1))("detects and accepts repairs for $title", async study => {
  const source = practiceQuestions.find(q => q.id === study.sourceQuestionId)!;
  mockQuery.mockResolvedValue({ rows: [{ answer: source.answer }] });
  const model = modelFor(study);
  expect((await validateAnswer(model, study.id, "study")).correct).toBe(false);
  expect(mockQuery).toHaveBeenLastCalledWith("SELECT answer FROM practice_questions WHERE id = $1", [study.sourceQuestionId]);
  if (study.id === 2) model.find(e => e.id === 1).value = 5;
  if (study.id === 3) model.find(e => e.type === ".frame").value.b = 2;
  if (study.id === 4) model.find(e => e.id === 3).value.push(1);
  if (study.id === 5) {
    const onlyValueFixed = JSON.parse(JSON.stringify(model));
    onlyValueFixed.find((e: any) => e.id === 4).value = 4;
    expect((await validateAnswer(onlyValueFixed, study.id, "study")).correct).toBe(false);
    model.find(e => e.id === 5).value.push(3);
    expect((await validateAnswer(model, study.id, "study")).correct).toBe(false);
    model.find(e => e.id === 4).value = 4;
  }
  expect(await validateAnswer(model, study.id, "study")).toEqual({ correct: true, errors: [] });
});
it("rejects unknown study IDs without querying another bank", async () => {
  expect((await validateAnswer([], 99, "study")).correct).toBe(false);
  expect(mockQuery).not.toHaveBeenCalled();
});

it.each(["study", "practice"] as const)("explains Task 2d errors clearly in %s validation, independent of object IDs", async category => {
  const study = studyQuestions.find(q => q.id === 5)!;
  const source = practiceQuestions.find(q => q.id === study.sourceQuestionId)!;
  mockQuery.mockResolvedValue({ rows: [{ answer: source.answer }] });
  const model = modelFor(study);
  // User IDs need not match answer IDs; messages must identify variables and indexes.
  for (const box of model) {
    if (box.id !== null) box.id += 100;
    if (box.type === ".frame") {
      for (const key of Object.keys(box.value)) box.value[key] += 100;
    } else if (box.type === "list") box.value = box.value.map((id: number) => id + 100);
  }
  const result = await validateAnswer(model, category === "study" ? study.id : source.id, category);
  expect(result.correct).toBe(false);
  expect(result.errors).toHaveLength(2);
  expect(result.errors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      message: "The list at x is missing an entry at index 2. It should contain 3 entries, but your diagram has 2.",
      elementId: 105,
    }),
    expect.objectContaining({
      message: "The value at y[3] should be 4, but your diagram shows 9.",
      elementId: 106, relatedIds: [104],
    }),
  ]));
});
