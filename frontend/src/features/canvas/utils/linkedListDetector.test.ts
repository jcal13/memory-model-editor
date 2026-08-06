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
