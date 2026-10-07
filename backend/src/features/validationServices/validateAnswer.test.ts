const mockQuery = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    query: mockQuery,
  })),
}));

import validateAnswer, { validateAnswerAtLine } from "./validateAnswer";
import { ErrorType } from "./errorStructuring";

const practiceQuestions = require("../../database/practiceQuestions.json") as Array<{
  id: number;
  answer: Array<Record<string, any>>;
  code: string[];
  topics: string[];
  steps: Array<{
    lineNumber: number;
    iterationNumber?: number;
    answer: Array<Record<string, any>>;
  }>;
}>;

describe("validateAnswer reference mismatch wording", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example.test/memory-model-editor";
  });

  it("uses the expected-object wording when one expected reference is drawn twice", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          answer: [
            {
              type: ".frame",
              name: "__main__",
              id: null,
              order: 0,
              value: { pair: 1 },
            },
            {
              type: "object",
              id: 1,
              name: "Pair",
              value: { left: 2, right: 2 },
            },
            { type: "int", id: 2, value: 7 },
          ],
        },
      ],
    });

    const result = await validateAnswer(
      [
        {
          type: ".frame",
          name: "__main__",
          id: null,
          order: 0,
          value: { pair: 10 },
        },
        {
          type: "object",
          id: 10,
          name: "Pair",
          value: { left: 20, right: 21 },
        },
        { type: "int", id: 20, value: 7 },
        { type: "int", id: 21, value: 7 },
      ],
      1,
      "practice",
    );

    expect(result.correct).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: ErrorType.REFERENCE_MISMATCH,
        message: "pair.right should point to the same int object as pair.left",
      }),
    );
  });

  it("uses the differing-object wording when two expected references share one drawn object", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          answer: [
            {
              type: ".frame",
              name: "__main__",
              id: null,
              order: 0,
              value: { pair: 1 },
            },
            {
              type: "object",
              id: 1,
              name: "Pair",
              value: { left: 2, right: 3 },
            },
            { type: "int", id: 2, value: 7 },
            { type: "int", id: 3, value: 8 },
          ],
        },
      ],
    });

    const result = await validateAnswer(
      [
        {
          type: ".frame",
          name: "__main__",
          id: null,
          order: 0,
          value: { pair: 10 },
        },
        {
          type: "object",
          id: 10,
          name: "Pair",
          value: { left: 20, right: 20 },
        },
        { type: "int", id: 20, value: 7 },
      ],
      1,
      "practice",
    );

    expect(result.correct).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: ErrorType.REFERENCE_MISMATCH,
        message: "pair.left and pair.right should not point to the same object",
      }),
    );
  });

  it('uses "None object" wording when the expected shared target is None', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          answer: [
            {
              type: ".frame",
              name: "__main__",
              id: null,
              order: 0,
              value: { pair: 1 },
            },
            {
              type: "object",
              id: 1,
              name: "Pair",
              value: { left: 2, right: 2 },
            },
            { type: "NoneType", id: 2, value: null },
          ],
        },
      ],
    });

    const result = await validateAnswer(
      [
        {
          type: ".frame",
          name: "__main__",
          id: null,
          order: 0,
          value: { pair: 10 },
        },
        {
          type: "object",
          id: 10,
          name: "Pair",
          value: { left: 20, right: 21 },
        },
        { type: "NoneType", id: 20, value: null },
        { type: "NoneType", id: 21, value: null },
      ],
      1,
      "practice",
    );

    const mismatchErrors = result.errors.filter(
      (error) => error.type === ErrorType.REFERENCE_MISMATCH,
    );

    expect(result.correct).toBe(false);
    expect(mismatchErrors).toEqual([
      expect.objectContaining({
        message: "pair.right should point to the same None object as pair.left",
      }),
    ]);
  });
});

describe("CSC148 Practice class and method answers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example.test/memory-model-editor";
  });

  it.each([17, 18])(
    "accepts question %i final and every line answer",
    async (questionId) => {
      const question = practiceQuestions.find((item) => item.id === questionId);
      if (!question) throw new Error(`Practice question ${questionId} is missing`);
      expect(question.topics).toEqual(
        questionId === 17 ? ["Creation", "Methods"] : ["Methods", "Mutation"],
      );

      const expectedLines = questionId === 17 ? [3, 4, 6] : [4, 5, 8];
      expect(question.steps.map((step) => step.lineNumber)).toEqual(
        expectedLines,
      );
      const finalScoreCard = question.answer.find(
        (box) => box.type === ".class" && box.name === "ScoreCard",
      );
      expect(finalScoreCard).toBeDefined();
      const finalPoints = question.answer.find(
        (box) => box.id === finalScoreCard?.value.points,
      );
      expect(finalPoints?.value).toBe(questionId === 17 ? 4 : 7);

      if (questionId === 17) {
        expect(question.code[1]).toContain("-> None:");
        expect(question.code).not.toContain("        return None");
        const firstInitializationStep = question.steps[0];
        const partialObject = firstInitializationStep.answer.find(
          (box) => box.type === ".class",
        );
        expect(partialObject?.value).toEqual({ name: 2 });
      } else {
        expect(question.code[2]).toContain("-> None:");
        expect(question.code[6]).toBe('card = ScoreCard("Mira", 4)');
        expect(question.code).not.toContain("        return None");
        const calculationStep = question.steps[0];
        const methodFrame = calculationStep.answer.find(
          (box) => box.name === "ScoreCard.add_points",
        );
        expect(methodFrame?.value).toEqual({
          self: 1,
          amount: 4,
          new_points: 5,
        });
        expect(calculationStep.answer.find((box) => box.id === 5)?.value).toBe(
          7,
        );
      }

      mockQuery.mockImplementation(async (query: string) => {
        if (query.includes("SELECT steps")) {
          return { rows: [{ steps: question.steps }] };
        }
        return { rows: [{ answer: question.answer }] };
      });

      const toFrontendModel = (answer: unknown) =>
        (answer as Array<Record<string, any>>).map((box) => ({
          ...box,
          type: box.type === ".class" ? "object" : box.type,
        })) as Parameters<typeof validateAnswer>[0];
      const finalResult = await validateAnswer(
        toFrontendModel(question.answer),
        questionId,
        "practice",
      );
      expect(finalResult).toEqual({ correct: true, errors: [] });
      for (const step of question.steps) {
        const lineResult = await validateAnswerAtLine(
          toFrontendModel(step.answer),
          questionId,
          "practice",
          step.lineNumber,
          step.iterationNumber,
        );

        expect(lineResult).toEqual({ correct: true, errors: [] });
      }
    },
  );
});


describe("missing attribute reference feedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example.test/memory-model-editor";
  });

  it.each([null, 999])("identifies both Question 17 attributes with invalid target %s", async (target) => {
    const answer = practiceQuestions.find((q) => q.id === 17)!.answer;
    mockQuery.mockResolvedValue({ rows: [{ answer }] });
    const result = await validateAnswer([
      { type: ".frame", name: "__main__", id: null, order: 1, value: { card: 1 } },
      { type: "object", name: "ScoreCard", id: 1, value: { name: target, points: target } },
    ], 17, "practice");

    expect(result.correct).toBe(false);
    expect(result.errors.map((error) => error.message)).toEqual([
      'Attribute "card.name" on the ScoreCard object is missing a valid reference',
      'Attribute "card.points" on the ScoreCard object is missing a valid reference',
    ]);
    expect(result.errors.every((error) => error.type === ErrorType.INVALID_REFERENCE)).toBe(true);
  });

  it("preserves the root variable message when card itself has no target", async () => {
    const answer = practiceQuestions.find((q) => q.id === 17)!.answer;
    mockQuery.mockResolvedValue({ rows: [{ answer }] });
    const result = await validateAnswer([
      { type: ".frame", name: "__main__", id: null, order: 1, value: { card: null } },
    ], 17, "practice");
    expect(result.errors.map((error) => error.message)).toEqual([
      'Variable "card" in __main__ is missing a valid reference',
    ]);
  });
});


describe("attribute reference feedback across object models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example.test/memory-model-editor";
  });

  it.each([
    { target: null, valid: false },
    { target: 999, valid: false },
    { target: 30, valid: true },
  ])("reports only the broken Book attribute (target=$target)", async ({ target, valid }) => {
    mockQuery.mockResolvedValue({ rows: [{ answer: [
      { type: ".frame", name: "__main__", id: null, order: 1, value: { book: 1 } },
      { type: ".class", name: "Book", id: 1, value: { title: 2, pages: 3 } },
      { type: "str", id: 2, value: "Dune" },
      { type: "int", id: 3, value: 412 },
    ] }] });

    const result = await validateAnswer([
      { type: ".frame", name: "__main__", id: null, order: 1, value: { book: 10 } },
      { type: "object", name: "Book", id: 10, value: { title: 20, pages: target } },
      { type: "str", id: 20, value: "Dune" },
      ...(valid ? [{ type: "int", id: 30, value: 412 }] : []),
    ], 1, "practice");

    expect(result.correct).toBe(valid);
    expect(result.errors).toEqual(valid ? [] : [expect.objectContaining({
      type: ErrorType.INVALID_REFERENCE,
      message: 'Attribute "book.pages" on the Book object is missing a valid reference',
    })]);
  });

  it.each([null, 999])("names the nested attribute and its immediate owner (target=%s)", async (target) => {
    mockQuery.mockResolvedValue({ rows: [{ answer: [
      { type: ".frame", name: "build_team", id: null, order: 1, value: { team: 1 } },
      { type: ".class", name: "Team", id: 1, value: { leader: 2 } },
      { type: ".class", name: "Person", id: 2, value: { name: 3 } },
      { type: "str", id: 3, value: "Ada" },
    ] }] });

    const result = await validateAnswer([
      { type: ".frame", name: "build_team", id: null, order: 1, value: { team: 10 } },
      { type: "object", name: "Team", id: 10, value: { leader: 20 } },
      { type: "object", name: "Person", id: 20, value: { name: target } },
    ], 1, "practice");

    expect(result.correct).toBe(false);
    expect(result.errors).toEqual([expect.objectContaining({
      type: ErrorType.INVALID_REFERENCE,
      message: 'Attribute "team.leader.name" on the Person object is missing a valid reference',
    })]);
  });

  it("reports an unconnected intermediate object without blaming its child attribute", async () => {
    mockQuery.mockResolvedValue({ rows: [{ answer: [
      { type: ".frame", name: "__main__", id: null, order: 1, value: { team: 1 } },
      { type: ".class", name: "Team", id: 1, value: { leader: 2 } },
      { type: ".class", name: "Person", id: 2, value: { name: 3 } },
      { type: "str", id: 3, value: "Ada" },
    ] }] });

    const result = await validateAnswer([
      { type: ".frame", name: "__main__", id: null, order: 1, value: { team: 10 } },
      { type: "object", name: "Team", id: 10, value: { leader: null } },
    ], 1, "practice");

    expect(result.correct).toBe(false);
    expect(result.errors).toEqual([expect.objectContaining({
      type: ErrorType.INVALID_REFERENCE,
      message: 'Attribute "team.leader" on the Team object is missing a valid reference',
    })]);
  });
});
