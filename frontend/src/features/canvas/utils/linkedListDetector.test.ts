import { CanvasElement } from "../../shared/types";
import { detectLinkedListGraph } from "./linkedListDetector";

function primitiveElement(
  boxId: number,
  id: number,
  type: "NoneType" | "int",
  value: string
): CanvasElement {
  return {
    boxId,
    id,
    x: 0,
    y: 0,
    kind: {
      name: "primitive",
      type,
      value,
    },
  };
}

function classElement(
  boxId: number,
  id: number,
  className: string,
  classVariables: Array<{ name: string; targetId: number | null }>
): CanvasElement {
  return {
    boxId,
    id,
    x: 0,
    y: 0,
    kind: {
      name: "class",
      type: "class",
      value: null,
      className,
      classVariables,
    },
  };
}

describe("detectLinkedListGraph", () => {
  it("builds linked-list graph nodes from canvas elements, preserving labels and terminal kinds", () => {
    const elements: CanvasElement[] = [
      {
        boxId: 1,
        id: "_",
        x: 0,
        y: 0,
        kind: {
          name: "function",
          type: "function",
          value: null,
          functionName: "__main__",
          params: [
            { name: "other", targetId: 3 },
            { name: "head", targetId: 1 },
          ],
        },
      },
      classElement(2, 1, "Node", [
        { name: "value", targetId: 10 },
        { name: "next", targetId: 2 },
      ]),
      classElement(3, 2, "Node", [
        { name: "value", targetId: 11 },
        { name: "next", targetId: 20 },
      ]),
      classElement(4, 3, "Node", [
        { name: "value", targetId: 12 },
        { name: "next", targetId: 99 },
      ]),
      primitiveElement(10, 10, "int", "10"),
      primitiveElement(11, 11, "int", "20"),
      primitiveElement(12, 12, "int", "30"),
      primitiveElement(20, 20, "NoneType", "None"),
    ];

    const graph = detectLinkedListGraph(elements);

    expect(graph.nodes).toEqual([
      expect.objectContaining({
        nodeId: 1,
        labels: ["head"],
        value: "10",
        nextKind: "node",
        nextTargetId: 2,
        group: 0,
      }),
      expect.objectContaining({
        nodeId: 2,
        value: "20",
        nextKind: "none",
        nextTargetId: null,
        group: 0,
      }),
      expect.objectContaining({
        nodeId: 3,
        labels: ["other"],
        value: "30",
        nextKind: "missing",
        nextTargetId: 99,
        group: 1,
      }),
    ]);
    expect(graph.edges).toEqual([{ fromId: 1, toId: 2 }]);
  });
});

// Use the actual saved question to catch regressions in legacy attributes.
const prepQuestions = require("../../../../../backend/src/database/prepQuestions.json");

it("detects the preloaded linked list in CSC148 Prep Q1", () => {
  const question = prepQuestions.find((question: { id: number }) => question.id === 1);
  const graph = detectLinkedListGraph(question.canvasConfig.elements);
  expect(graph.nodes).toEqual([
    expect.objectContaining({ nodeId: 2, value: "165", labels: ["_first"], nextTargetId: 4 }),
    expect.objectContaining({ nodeId: 4, value: "108", nextKind: "none" }),
  ]);
  expect(graph.edges).toEqual([{ fromId: 2, toId: 4 }]);
});

it("ignores malformed labels and handles missing attribute arrays", () => {
  const elements = [
    { id: "_", kind: { name: "function", params: [null, { targetId: 1 }, { name: 42, targetId: 1 }] } },
    { id: 1, kind: { name: "class", classVariables: [null, { value: 2 }] } },
    { id: 2, kind: { name: "class" } },
  ] as unknown as CanvasElement[];
  expect(detectLinkedListGraph(elements)).toEqual({ nodes: [], edges: [] });
});

it("returns an empty graph for ordinary non-linked-list elements", () => {
  expect(detectLinkedListGraph([
    primitiveElement(1, 1, "int", "7"),
    classElement(2, 2, "Person", [{ name: "age", targetId: 1 }]),
  ])).toEqual({ nodes: [], edges: [] });
});

it("preserves an explicitly missing modern pointer over a legacy value", () => {
  const element = classElement(1, 1, "Node", [
    { name: "next", targetId: null, value: 2 } as { name: string; targetId: null },
  ]);
  expect(detectLinkedListGraph([element, primitiveElement(2, 2, "NoneType", "None")]).nodes[0])
    .toMatchObject({ nextKind: "missing", nextTargetId: null });
});
