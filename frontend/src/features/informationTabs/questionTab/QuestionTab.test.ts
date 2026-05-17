import React from "react";
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));
import {
  buildLineIterations,
  getCheckableLines,
  getNextCheckableLine,
  sortCheckableLines,
  QuestionData,
} from "./QuestionTab";

describe("QuestionTab helper functions", () => {
  const questionData: QuestionData = {
    id: 1,
    question: "x = 1",
    code: ["x = 1", "y = x"],
    answer: null,
    steps: [
      { lineNumber: 1, answer: null },
      { lineNumber: 2, iterationNumber: 0, answer: null },
      { lineNumber: 2, iterationNumber: 2, answer: null },
    ],
    description: null,
    topics: ["variables"],
    canvasConfig: null,
  };

  it("returns unique checkable line numbers", () => {
    const result = getCheckableLines(questionData);
    expect(result).toEqual(new Set([1, 2]));
  });

  it("sorts checkable lines numerically", () => {
    const result = sortCheckableLines(new Set([10, 3, 5]));
    expect(result).toEqual([3, 5, 10]);
  });

  it("builds line iteration mapping and sorts iterations", () => {
    const result = buildLineIterations(questionData);
    expect(result.get(1)).toEqual(undefined);
    expect(result.get(2)).toEqual([0, 2]);
  });

  it("returns the next checkable line or null at the end", () => {
    expect(getNextCheckableLine([1, 2, 3], 1)).toBe(2);
    expect(getNextCheckableLine([1, 2, 3], 2)).toBe(3);
    expect(getNextCheckableLine([1, 2, 3], 4)).toBeNull();
    expect(getNextCheckableLine([1, 2, 4], null)).toBeNull();
  });
});
