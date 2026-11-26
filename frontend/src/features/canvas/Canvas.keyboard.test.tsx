import React, { useState } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import Canvas from "./Canvas";
import LiveAnnouncer, { ANNOUNCE_DELAY_MS } from "../a11y/announcer";
import { CanvasElement } from "../shared/types";

// Boxes render as bare focusable groups, the way CanvasBox tags them.
jest.mock("./components/CanvasBox", () => ({
  __esModule: true,
  default: ({ element }: { element: CanvasElement }) => (
    <g data-canvas-box-id={element.boxId} data-canvas-kind={element.kind.name} />
  ),
}));
jest.mock("./components/CallStack", () => ({
  __esModule: true,
  default: ({ frames }: { frames: CanvasElement[] }) => (
    <g data-tour="call-stack">
      {frames.map((f) => (
        <g key={f.boxId} data-canvas-box-id={f.boxId} data-canvas-kind="function" />
      ))}
    </g>
  ),
}));
jest.mock("./components/ReferenceArrows", () => ({ __esModule: true, default: () => null }));
jest.mock("./utils/validation", () => ({ validateElements: (els: CanvasElement[]) => els }));

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

const start: CanvasElement[] = [
  {
    boxId: 0, id: "_", x: 0, y: 0,
    kind: { name: "function", type: "function", value: null, functionName: "__main__", params: [{ name: "a", targetId: 3 }] },
  },
  { boxId: 1, id: 3, x: 300, y: 40, kind: { name: "list", type: "list", value: [] } },
  { boxId: 2, id: 4, x: 500, y: 40, kind: { name: "primitive", type: "int", value: "5" } },
];

let current: CanvasElement[] = [];
let keyboardAdd: ((boxType: string) => void) | null = null;

function Harness({ textView = false }: { textView?: boolean }) {
  const [elements, setElements] = useState(start);
  const [ids, setIds] = useState([3, 4]);
  current = elements;
  return (
    <>
      <LiveAnnouncer />
      <Canvas
        elements={elements}
        setElements={setElements}
        ids={ids}
        addId={(id) => setIds((p) => [...p, id])}
        removeId={(id) => setIds((p) => p.filter((x) => x !== id))}
        onClear={jest.fn()}
        sandbox={false}
        textView={textView}
        onKeyboardAddReady={(add) => (keyboardAdd = add)}
      />
    </>
  );
}

const box = (boxId: number) =>
  document.querySelector(`g[data-canvas-box-id="${boxId}"]`) as SVGGElement;

const flushFrames = () => {
  for (let i = 0; i < 10; i++) act(() => jest.advanceTimersByTime(20));
};

describe("Canvas keyboard and screen-reader support", () => {
  beforeAll(() => {
    (global as typeof globalThis).ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
  });
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => jest.useRealTimers());

  it("+ adds a slot to the focused box and announces it", () => {
    render(<Harness />);
    act(() => box(1).focus());
    fireEvent.keyDown(box(1), { key: "+" });
    expect(current.find((e) => e.boxId === 1)?.kind).toMatchObject({ value: ["_"] });
    act(() => jest.advanceTimersByTime(ANNOUNCE_DELAY_MS));
    expect(screen.getByRole("status")).toHaveTextContent("Added element 1 to list id3");
  });

  it("+ on a primitive does nothing", () => {
    render(<Harness />);
    act(() => box(2).focus());
    fireEvent.keyDown(box(2), { key: "+" });
    expect(current.find((e) => e.boxId === 2)?.kind).toEqual(start[2].kind);
  });

  it("Delete removes the focused box, announces it and focuses a neighbour", () => {
    render(<Harness />);
    act(() => box(1).focus());
    fireEvent.keyDown(box(1), { key: "Delete" });
    expect(current.some((e) => e.boxId === 1)).toBe(false);
    flushFrames();
    expect(document.activeElement?.getAttribute("data-canvas-box-id")).not.toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Deleted list id3");
  });

  it("the palette's keyboard add puts a new box on the canvas and focuses it", () => {
    render(<Harness />);
    const svg = screen.getByTestId("canvas") as unknown as SVGSVGElement;
    // jsdom has no SVG geometry: give the canvas a viewBox and identity CTM.
    Object.defineProperty(svg, "viewBox", { configurable: true, value: { baseVal: { x: 0, y: 0, width: 1200, height: 800 } } });
    const identity = { inverse: () => identity };
    (svg as any).getScreenCTM = () => identity;
    (svg as any).createSVGPoint = () => ({ x: 0, y: 0, matrixTransform(this: any) { return { x: this.x, y: this.y }; } });
    act(() => keyboardAdd!("dict"));
    const added = current.find((e) => e.kind.name === "dict");
    expect(added).toBeDefined();
    expect(added?.id).toBe(1); // Practice: next free id
    flushFrames();
    expect(document.activeElement).toBe(box(added!.boxId));
  });

  it("keeps a text outline in sync, hidden unless Text view is on", () => {
    const { rerender } = render(<Harness />);
    const view = screen.getByTestId("model-text-view");
    expect(within(view).getByRole("heading", { name: "Text view of the memory model" })).toBeInTheDocument();
    expect(view).toHaveTextContent("__main__: a → id3");
    expect(view).toHaveTextContent("id3: list []");
    expect(within(view).queryByRole("button")).toBeNull(); // no invisible Tab stops
    act(() => box(1).focus());
    fireEvent.keyDown(box(1), { key: "+" });
    expect(view).toHaveTextContent("id3: list [empty]");

    rerender(<Harness textView />);
    const line = within(screen.getByTestId("model-text-view")).getByRole("button", { name: "id4: int 5" });
    fireEvent.click(line);
    expect(document.activeElement).toBe(box(2));
  });
});
