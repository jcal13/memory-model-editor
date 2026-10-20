import React from "react";
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));
import {
  buildLineIterations,
  checkStepConsistency,
  extractStepAssignments,
  getCheckableLines,
  getNextCheckableLine,
  sortCheckableLines,
  QuestionData,
  StepAssignments,
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

// ─── Helper canvas element factories ────────────────────────────────────────

function makeFrame(params: { name: string; targetId: number | null }[]) {
  return {
    boxId: 0,
    id: "_",
    x: 0,
    y: 0,
    kind: {
      name: "function",
      type: "function",
      value: null,
      functionName: "__main__",
      params,
    },
  };
}

function makePrimitive(id: number, type: string, value: string) {
  return { boxId: id, id, x: 0, y: 0, kind: { name: "primitive", type, value } };
}

function makeClass(classVariables: { name: string; targetId: number | null }[]) {
  return {
    boxId: 99,
    id: "_",
    x: 0,
    y: 0,
    kind: {
      name: "class",
      type: "class",
      value: null,
      className: "MyClass",
      classVariables,
    },
  };
}

// ─── extractStepAssignments ──────────────────────────────────────────────────

describe("extractStepAssignments", () => {
  it("returns empty maps for an empty element list", () => {
    expect(extractStepAssignments([])).toEqual({ variableToId: {}, idToType: {} });
  });

  it("extracts variable→id mappings from a function frame's params", () => {
    const result = extractStepAssignments([
      makeFrame([{ name: "a", targetId: 1 }, { name: "b", targetId: 2 }]),
    ]);
    expect(result.variableToId).toEqual({ a: 1, b: 2 });
    expect(result.idToType).toEqual({});
  });

  it("skips params whose targetId is null", () => {
    const result = extractStepAssignments([
      makeFrame([{ name: "a", targetId: null }, { name: "b", targetId: 3 }]),
    ]);
    expect(result.variableToId).toEqual({ b: 3 });
  });

  it("extracts idToType from primitive elements with numeric ids", () => {
    const result = extractStepAssignments([
      makePrimitive(1, "int", "5"),
      makePrimitive(2, "str", "hello"),
    ]);
    expect(result.idToType).toEqual({ 1: "int", 2: "str" });
    expect(result.variableToId).toEqual({});
  });

  it("ignores non-frame elements whose id is not a number", () => {
    const result = extractStepAssignments([
      { boxId: 0, id: "_", kind: { name: "primitive", type: "int", value: "5" } },
    ]);
    expect(result.idToType).toEqual({});
  });

  it("combines frame variable mappings and primitive type mappings", () => {
    const result = extractStepAssignments([
      makeFrame([{ name: "x", targetId: 7 }]),
      makePrimitive(7, "float", "3.14"),
    ]);
    expect(result.variableToId).toEqual({ x: 7 });
    expect(result.idToType).toEqual({ 7: "float" });
  });

  it("extracts classVariables from class elements", () => {
    const result = extractStepAssignments([
      makeClass([{ name: "attr", targetId: 5 }]),
    ]);
    expect(result.variableToId).toEqual({ attr: 5 });
  });

  it("skips class classVariables with null targetId", () => {
    const result = extractStepAssignments([
      makeClass([{ name: "attr", targetId: null }, { name: "other", targetId: 9 }]),
    ]);
    expect(result.variableToId).toEqual({ other: 9 });
  });
});

// ─── checkStepConsistency ────────────────────────────────────────────────────

describe("checkStepConsistency", () => {
  const empty: StepAssignments = { variableToId: {}, idToType: {} };

  it("returns null when committed state is empty", () => {
    const current: StepAssignments = { variableToId: { a: 1 }, idToType: { 1: "int" } };
    expect(checkStepConsistency(empty, current)).toBeNull();
  });

  it("returns null when variable still maps to the same id", () => {
    const committed: StepAssignments = { variableToId: { a: 1 }, idToType: {} };
    const current: StepAssignments = { variableToId: { a: 1, b: 2 }, idToType: {} };
    expect(checkStepConsistency(committed, current)).toBeNull();
  });

  it("returns an error naming the variable and both ids when variable→id changes", () => {
    const committed: StepAssignments = { variableToId: { a: 1 }, idToType: {} };
    const current: StepAssignments = { variableToId: { a: 2 }, idToType: {} };
    const error = checkStepConsistency(committed, current);
    expect(error).not.toBeNull();
    expect(error).toMatch(/variable "a"/i);
    expect(error).toMatch(/id 1/);
    expect(error).toMatch(/id 2/);
  });

  it("returns null when an id still has the same type", () => {
    const committed: StepAssignments = { variableToId: {}, idToType: { 1: "int" } };
    const current: StepAssignments = { variableToId: {}, idToType: { 1: "int", 2: "str" } };
    expect(checkStepConsistency(committed, current)).toBeNull();
  });

  it("returns an error naming the id and both types when type changes", () => {
    const committed: StepAssignments = { variableToId: {}, idToType: { 1: "int" } };
    const current: StepAssignments = { variableToId: {}, idToType: { 1: "str" } };
    const error = checkStepConsistency(committed, current);
    expect(error).not.toBeNull();
    expect(error).toMatch(/id 1/i);
    expect(error).toMatch(/int/);
    expect(error).toMatch(/str/);
  });

  it("returns null when a committed variable is absent from the current state", () => {
    // Absence is a backend concern (missing element), not a consistency violation
    const committed: StepAssignments = { variableToId: { a: 1 }, idToType: {} };
    expect(checkStepConsistency(committed, empty)).toBeNull();
  });

  it("returns null when a committed id is absent from the current state", () => {
    const committed: StepAssignments = { variableToId: {}, idToType: { 1: "int" } };
    expect(checkStepConsistency(committed, empty)).toBeNull();
  });

  it("checks variable mappings before id types", () => {
    // Both a variable AND a type are wrong; the variable error should be reported first
    const committed: StepAssignments = { variableToId: { a: 1 }, idToType: { 1: "int" } };
    const current: StepAssignments = { variableToId: { a: 2 }, idToType: { 1: "str" } };
    const error = checkStepConsistency(committed, current);
    expect(error).not.toBeNull();
    expect(error).toMatch(/variable "a"/i);
  });

  it("returns null for two steps where nothing changed", () => {
    const state: StepAssignments = { variableToId: { a: 1, b: 2 }, idToType: { 1: "int", 2: "int" } };
    expect(checkStepConsistency(state, state)).toBeNull();
  });
});
