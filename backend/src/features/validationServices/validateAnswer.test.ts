const mockQuery = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    query: mockQuery,
  })),
}));

import validateAnswer, { validateAnswerAtLine } from "./validateAnswer";
import { ErrorType } from "./errorStructuring";

const prepQuestions = require("../../database/prepQuestions.json") as Array<{
  id: number;
  answer: Array<Record<string, any>>;
  code: string[];
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
      "practice"
    );

    expect(result.correct).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: ErrorType.REFERENCE_MISMATCH,
        message: "pair.right should point to the same int object as pair.left",
      })
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
      "practice"
    );

    expect(result.correct).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: ErrorType.REFERENCE_MISMATCH,
        message: "pair.left and pair.right should not point to the same object",
      })
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
      "practice"
    );

    const mismatchErrors = result.errors.filter(
      (error) => error.type === ErrorType.REFERENCE_MISMATCH
    );

    expect(result.correct).toBe(false);
    expect(mismatchErrors).toEqual([
      expect.objectContaining({
        message:
          "pair.right should point to the same None object as pair.left",
      }),
    ]);
  });
});

describe("CSC148 Prep class and method answers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example.test/memory-model-editor";
  });

  it.each([5, 6])(
    "accepts question %i final and every line answer",
    async (questionId) => {
    const question = prepQuestions.find((item) => item.id === questionId);
    if (!question) throw new Error(`Prep question ${questionId} is missing`);

    const expectedLines = questionId === 5 ? [3, 4, 7] : [4, 5, 8];
    expect(question.steps.map((step) => step.lineNumber)).toEqual(expectedLines);
    const finalScoreCard = question.answer.find(
      (box) => box.type === ".class" && box.name === "ScoreCard"
    );
    expect(finalScoreCard).toBeDefined();
    const finalPoints = question.answer.find(
      (box) => box.id === finalScoreCard?.value.points
    );
    expect(finalPoints?.value).toBe(questionId === 5 ? 4 : 7);

    if (questionId === 5) {
      const firstInitializationStep = question.steps[0];
      const partialObject = firstInitializationStep.answer.find(
        (box) => box.type === ".class"
      );
      expect(partialObject?.value).toEqual({ name: 2 });
    } else {
      const calculationStep = question.steps[0];
      const methodFrame = calculationStep.answer.find(
        (box) => box.name === "ScoreCard.add_points"
      );
      expect(methodFrame?.value).toEqual({
        self: 1,
        amount: 4,
        new_points: 5,
      });
      expect(calculationStep.answer.find((box) => box.id === 5)?.value).toBe(7);
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
      "prep"
    );
    expect(finalResult).toEqual({ correct: true, errors: [] });
      for (const step of question.steps) {
        const lineResult = await validateAnswerAtLine(
          toFrontendModel(step.answer),
          questionId,
          "prep",
          step.lineNumber,
          step.iterationNumber
        );

        expect(lineResult).toEqual({ correct: true, errors: [] });
      }
    }
  );
});
