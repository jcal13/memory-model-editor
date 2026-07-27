import {
  buildLinkedListGraphLayout,
  createReturnEdgePath,
  createSelfLoopPath,
} from "./linkedListRenderer";
import { LinkedListGraph } from "./linkedListDetector";

describe("linkedListRenderer edge cases", () => {
  it("marks a node that points to itself as a self edge", () => {
    const graph: LinkedListGraph = {
      nodes: [
        {
          nodeId: 1,
          className: "Node",
          value: "10",
          labels: ["head"],
          nextKind: "node",
          nextTargetId: 1,
          group: 0,
        },
      ],
      edges: [{ fromId: 1, toId: 1 }],
    };

    const layout = buildLinkedListGraphLayout(graph, 500);

    expect(layout.edges).toEqual([{ fromId: 1, toId: 1, kind: "self" }]);
    expect(createSelfLoopPath(layout.nodes[0])).toContain("A");
  });

  it("marks an edge to an earlier node in the same row as backward", () => {
    const graph: LinkedListGraph = {
      nodes: [
        {
          nodeId: 1,
          className: "Node",
          value: "10",
          labels: ["head"],
          nextKind: "none",
          nextTargetId: null,
          group: 0,
        },
        {
          nodeId: 2,
          className: "Node",
          value: "20",
          labels: ["second"],
          nextKind: "node",
          nextTargetId: 1,
          group: 0,
        },
      ],
      edges: [{ fromId: 2, toId: 1 }],
    };

    const layout = buildLinkedListGraphLayout(graph, 500);

    expect(layout.edges).toEqual([{ fromId: 2, toId: 1, kind: "backward" }]);
    expect(createReturnEdgePath(layout.nodes[1], layout.nodes[0])).toContain("A");
  });

  it("keeps ordinary left-to-right next pointers as forward edges", () => {
    const graph: LinkedListGraph = {
      nodes: [
        {
          nodeId: 1,
          className: "Node",
          value: "10",
          labels: ["head"],
          nextKind: "node",
          nextTargetId: 2,
          group: 0,
        },
        {
          nodeId: 2,
          className: "Node",
          value: "20",
          labels: ["second"],
          nextKind: "none",
          nextTargetId: null,
          group: 0,
        },
      ],
      edges: [{ fromId: 1, toId: 2 }],
    };

    const layout = buildLinkedListGraphLayout(graph, 500);

    expect(layout.edges).toEqual([{ fromId: 1, toId: 2, kind: "forward" }]);
  });
});
