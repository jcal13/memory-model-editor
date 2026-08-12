const mockQuery = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    query: mockQuery,
  })),
}));

import validateAnswer from "./validateAnswer";
import { ErrorType } from "./errorStructuring";

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
