import React from "react";
import { fireEvent, render } from "@testing-library/react";
import MemoryModelEditor from "./MemoryModelEditor";

jest.mock("../canvas/Canvas", () => ({
  __esModule: true,
  default: () => <div data-testid="canvas">Canvas</div>,
}));

jest.mock("../palette/Palette", () => ({
  __esModule: true,
  default: () => <div data-testid="palette">Palette</div>,
}));

jest.mock("./components/ConfirmationModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../informationTabs/InformationTabs", () => ({
  __esModule: true,
  default: () => <div data-testid="information-tabs">Information</div>,
}));

jest.mock("./components/PanelToggleButtons", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("./hooks/useResponsivePanels", () => ({
  useResponsivePanels: () => undefined,
}));

jest.mock("./hooks/useCanvasSubmission", () => ({
  useCanvasSubmission: () => ({
    handleCanvasSubmit: jest.fn(),
    handleCanvasSubmitAtLine: jest.fn(),
  }),
}));

jest.mock("./hooks/useLocalStorage", () => ({
  useCanvasLocalStorage: () => undefined,
  useUILocalStorage: () => undefined,
}));

jest.mock("./hooks/useUndoHistory", () => ({
  useUndoHistory: () => ({
    canUndo: false,
    canRedo: false,
    undo: jest.fn(),
    redo: jest.fn(),
    recordState: jest.fn(),
    clearHistory: jest.fn(),
  }),
}));

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

describe("MemoryModelEditor info panel resizing", () => {
  let containerWidth = 1200;
  let innerWidthDescriptor: PropertyDescriptor | undefined;
  let rectSpy: jest.SpyInstance<DOMRect, [], HTMLElement>;

  beforeAll(() => {
    (global as typeof globalThis).ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    localStorage.clear();
    containerWidth = 1200;
    innerWidthDescriptor = Object.getOwnPropertyDescriptor(window, "innerWidth");
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1600,
    });
    rectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function mockRect(this: HTMLElement) {
        const isMainContainer =
          typeof this.className === "string" &&
          this.className.split(" ").includes("mainContainer");
        const width = isMainContainer ? containerWidth : 0;

        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: width,
          bottom: 0,
          width,
          height: 0,
          toJSON: () => ({}),
        } as DOMRect;
      });
  });

  afterEach(() => {
    rectSpy.mockRestore();
    if (innerWidthDescriptor) {
      Object.defineProperty(window, "innerWidth", innerWidthDescriptor);
    }
  });

  it("keeps the information panel at its minimum width when a drag ends too small to settle", () => {
    containerWidth = 1048;
    const { container } = render(<MemoryModelEditor />);

    const infoPanel = container.querySelector(".infoPanel") as HTMLElement;
    const resizeDividers = container.querySelectorAll(".resizeDivider");
    const infoResizeDivider = resizeDividers[resizeDividers.length - 1] as HTMLElement;

    fireEvent.mouseDown(infoResizeDivider);
    fireEvent.mouseMove(document, { clientX: 898 });
    fireEvent.mouseUp(document, { clientX: 898 });

    expect(infoPanel.style.width).toBe("260px");
  });

  it("caps the information panel so the canvas keeps its minimum column width", () => {
    containerWidth = 1200;
    const { container } = render(<MemoryModelEditor />);

    const infoPanel = container.querySelector(".infoPanel") as HTMLElement;
    const canvasColumn = container.querySelector(".canvasColumn") as HTMLElement;
    const resizeDividers = container.querySelectorAll(".resizeDivider");
    const infoResizeDivider = resizeDividers[resizeDividers.length - 1] as HTMLElement;

    fireEvent.mouseDown(infoResizeDivider);
    fireEvent.mouseMove(document, { clientX: 0 });
    fireEvent.mouseUp(document, { clientX: 0 });

    expect(infoPanel.style.width).toBe("412px");
    expect(containerWidth - parseInt(infoPanel.style.width, 10) - 8).toBe(780);
    expect(canvasColumn).toBeInTheDocument();
  });
});
