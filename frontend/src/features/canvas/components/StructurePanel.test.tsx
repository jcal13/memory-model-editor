import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import StructurePanel from "./StructurePanel";
import * as preview from "./LinkedListPreview";
import { CanvasElement } from "../../shared/types";

const prepQuestions = require("../../../../../backend/src/database/prepQuestions.json");
const props = {
  enabled: true,
  elements: [] as CanvasElement[],
  collapsed: false,
  height: 180,
  onCollapsedChange: jest.fn(),
  onHeightChange: jest.fn(),
};

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof ResizeObserver;
});

it("shows an empty state only when enabled", () => {
  const { rerender } = render(<StructurePanel {...props} enabled={false} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  rerender(<StructurePanel {...props} />);
  expect(screen.getByRole("status")).toHaveTextContent("No linked lists detected.");
});

it("updates between empty canvases and the real Prep Q1 structure", () => {
  const { rerender } = render(<StructurePanel {...props} />);
  const elements = prepQuestions.find((q: { id: number }) => q.id === 1).canvasConfig.elements;
  rerender(<StructurePanel {...props} elements={elements} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Linked list visualization" })).toBeInTheDocument();
  expect(screen.getByText("165")).toBeInTheDocument();
  expect(screen.getByText("108")).toBeInTheDocument();
  rerender(<StructurePanel {...props} />);
  expect(screen.getByRole("status")).toHaveTextContent("No linked lists detected.");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});


describe("visualizer failure isolation", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("contains detection errors, keeps sibling controls usable, and recovers after a canvas change", () => {
    const onEdit = jest.fn();
    const broken = [{ id: 1 }] as CanvasElement[];
    const view = (elements: CanvasElement[]) => (
      <>
        <button onClick={onEdit}>Edit canvas</button>
        <StructurePanel {...props} elements={elements} />
      </>
    );
    const { rerender } = render(view(broken));
    expect(screen.getByRole("status")).toHaveTextContent("Visualization unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Collapse visualization" }));
    expect(props.onCollapsedChange).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "Edit canvas" }));
    expect(onEdit).toHaveBeenCalledTimes(1);

    const elements = prepQuestions.find((q: { id: number }) => q.id === 1).canvasConfig.elements;
    rerender(view(elements));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Linked list visualization" })).toBeInTheDocument();
  });

  it("contains preview rendering errors and retries after toggling off and on", () => {
    const elements = prepQuestions.find((q: { id: number }) => q.id === 1).canvasConfig.elements;
    const renderPreview = jest.spyOn(preview, "default").mockImplementation(() => {
      throw new Error("Preview rendering failed");
    });
    const { rerender } = render(<StructurePanel {...props} elements={elements} />);
    expect(screen.getByRole("status")).toHaveTextContent("Visualization unavailable");

    renderPreview.mockRestore();
    rerender(<StructurePanel {...props} elements={elements} enabled={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    rerender(<StructurePanel {...props} elements={elements} />);
    expect(screen.getByRole("img", { name: "Linked list visualization" })).toBeInTheDocument();
  });
});
