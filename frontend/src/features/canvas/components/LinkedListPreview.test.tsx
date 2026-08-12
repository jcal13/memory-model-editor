import React from "react";
import { render, screen } from "@testing-library/react";
import LinkedListPreview from "./LinkedListPreview";
import { LinkedListGraph } from "../utils/linkedListDetector";

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

describe("LinkedListPreview", () => {
  beforeAll(() => {
    (global as typeof globalThis).ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  it("renders terminal None labels and dots for missing next pointers", () => {
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
          labels: ["broken"],
          nextKind: "missing",
          nextTargetId: 99,
          group: 1,
        },
      ],
      edges: [],
    };

    const { container } = render(<LinkedListPreview graph={graph} />);

    expect(
      screen.getByRole("img", { name: /linked list visualization/i })
    ).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByText("head")).toBeInTheDocument();
    expect(screen.getByText("broken")).toBeInTheDocument();
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });
});
