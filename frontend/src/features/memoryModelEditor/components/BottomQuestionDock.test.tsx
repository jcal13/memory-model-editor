import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import BottomQuestionDock from "./BottomQuestionDock";

jest.mock("../../shared/uiScale", () => ({ uiScale: () => 1 }));

let canvasHeight = 400;
let observers: (() => void)[] = [];

class ResizeObserverMock {
  constructor(private cb: () => void) {
    observers.push(() => this.cb());
  }
  observe() {}
  disconnect() {}
}

function Harness() {
  const col = useRef<HTMLDivElement>(null);
  return (
    <div ref={col}>
      <div data-tour="canvas" />
      <BottomQuestionDock open onOpenChange={() => {}} columnRef={col}>
        <p>question</p>
      </BottomQuestionDock>
      <div>linked list panel below the dock</div>
    </div>
  );
}

const dockHeight = () => parseFloat(screen.getByText("question").parentElement!.style.height);

describe("BottomQuestionDock", () => {
  let rectSpy: jest.SpyInstance;
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("memorylab_bottom_dock_height", "300");
    canvasHeight = 400;
    observers = [];
    (global as any).ResizeObserver = ResizeObserverMock;
    rectSpy = jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const h = this.getAttribute("data-tour") === "canvas" ? canvasHeight : 0;
      return { top: 0, bottom: h, left: 0, right: 0, width: 0, height: h, x: 0, y: 0, toJSON() {} } as DOMRect;
    });
  });
  afterEach(() => rectSpy.mockRestore());

  it("grows by the distance dragged, whatever sits below it", () => {
    render(<Harness />);
    expect(dockHeight()).toBe(300);
    const bar = screen.getByRole("separator", { name: "Resize question panel" });
    fireEvent.mouseDown(bar, { clientY: 500 });
    fireEvent.mouseMove(document, { clientY: 470 });
    expect(dockHeight()).toBe(330); // no jump by the panel's height
    fireEvent.mouseMove(document, { clientY: 520 });
    expect(dockHeight()).toBe(280);
    fireEvent.mouseUp(document);
    expect(localStorage.getItem("memorylab_bottom_dock_height")).toBe("280");
  });

  it("stops growing when the canvas reaches its minimum", () => {
    render(<Harness />);
    const bar = screen.getByRole("separator", { name: "Resize question panel" });
    fireEvent.mouseDown(bar, { clientY: 500 });
    fireEvent.mouseMove(document, { clientY: -5000 });
    // 400px canvas - 220px minimum = 180px more at most.
    expect(dockHeight()).toBe(480);
  });

  it("gives height back when the canvas is squeezed below its minimum", () => {
    render(<Harness />);
    canvasHeight = 120; // e.g. the window got shorter
    act(() => observers.forEach((fire) => fire()));
    expect(dockHeight()).toBe(200);
  });
});
