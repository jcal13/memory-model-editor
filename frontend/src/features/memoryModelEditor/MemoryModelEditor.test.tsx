import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import MemoryModelEditor from "./MemoryModelEditor";

jest.mock("../canvas/Canvas", () => ({
  __esModule: true,
  default: () => <div data-testid="canvas">Canvas</div>,
}));

jest.mock("../palette/Palette", () => ({
  __esModule: true,
  default: ({onModeToggle, isSandboxMode}: any) => <button onClick={onModeToggle}>{isSandboxMode ? "Guided Palette" : "Full Palette"}</button>,
}));

jest.mock("./components/ConfirmationModal", () => ({
  __esModule: true,
  default: ({onConfirm, onCancel}: any) => <><button onClick={onConfirm}>Confirm mode</button><button onClick={onCancel}>Cancel mode</button></>,
}));

jest.mock("../informationTabs/InformationTabs", () => ({
  __esModule: true,
  default: ({questionIndex, questionType, currentCanvasState, onQuestionDataChange, onRestoreCanvas}: any) => <>
    <div data-testid="information-tabs">{questionType}:{questionIndex}:{currentCanvasState.elements.map((element: any) => element.kind.name).join(',')}</div>
    <div data-testid="canvas-values">{JSON.stringify(currentCanvasState)}</div>
    <button onClick={() => {
      const initial = {elements: [{boxId: 5, id: 5, x: 0, y: 0, kind: {name: 'primitive', type: 'int', value: '7'}}], ids: [5], classes: []};
      onQuestionDataChange({canvasConfig: initial});
      onRestoreCanvas([{...initial.elements[0], kind: {...initial.elements[0].kind, value: '99'}}], [5], []);
    }}>Load edited question</button>
  </>,
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
    window.history.replaceState(null, "", "/");
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
  it.each(['practice', 'test', 'prep', 'experiment'])('resets a linked %s question to its starting model without changing its URL', type => {
    const id = type === 'practice' ? 2 : 1;
    window.history.replaceState(null, '', `/?${type}=${id}`);
    localStorage.setItem('canvas_ui_state_v3', JSON.stringify({sandboxMode: false}));
    render(<MemoryModelEditor />);
    expect(screen.getByRole('button', {name: 'Guided Palette'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Load edited question'}));
    expect(screen.getByTestId('canvas-values')).toHaveTextContent('99');
    fireEvent.click(screen.getByRole('button', {name: 'Guided Palette'}));
    fireEvent.click(screen.getByRole('button', {name: 'Cancel mode'}));
    expect(screen.getByTestId('canvas-values')).toHaveTextContent('99');
    fireEvent.click(screen.getByRole('button', {name: 'Guided Palette'}));
    fireEvent.click(screen.getByRole('button', {name: 'Confirm mode'}));
    expect(screen.getByRole('button', {name: 'Full Palette'})).toBeInTheDocument();
    expect(screen.getByTestId('information-tabs')).toHaveTextContent(`${type}:${id}:function,primitive`);
    expect(screen.getByTestId('canvas-values')).not.toHaveTextContent('99');
    expect(screen.getByTestId('canvas-values')).toHaveTextContent('"value":"7"');
    expect(window.location.search).toBe(`?${type}=${id}`);
    fireEvent.click(screen.getByRole('button', {name: 'Full Palette'}));
    fireEvent.click(screen.getByRole('button', {name: 'Confirm mode'}));
    expect(screen.getByRole('button', {name: 'Guided Palette'})).toBeInTheDocument();
    expect(window.location.search).toBe(`?${type}=${id}`);
  });

  it('confirming a mode change resets the canvas but preserves question selection', () => {
    const canvas = {elements:[{boxId:1,id:1,x:0,y:0,kind:{name:'primitive',type:'int',value:'5'}}],ids:[1],classes:[]};
    localStorage.setItem('canvas_key',JSON.stringify(canvas));
    localStorage.setItem('question_canvas_practice_1',JSON.stringify(canvas));
    localStorage.setItem('canvas_ui_state_v3',JSON.stringify({questionIndex:1,questionType:'practice',questionView:'question',sandboxMode:true}));
    render(<MemoryModelEditor sandbox={true}/>);
    expect(screen.getByTestId('information-tabs')).toHaveTextContent('practice:1:primitive');
    fireEvent.click(screen.getByRole('button',{name:'Guided Palette'}));
    fireEvent.click(screen.getByRole('button',{name:'Cancel mode'}));
    expect(screen.getByRole('button',{name:'Guided Palette'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Guided Palette'}));
    fireEvent.click(screen.getByRole('button',{name:'Confirm mode'}));
    expect(screen.getByRole('button',{name:'Full Palette'})).toBeInTheDocument();
    expect(screen.getByTestId('information-tabs')).toHaveTextContent('practice:1:function');
    expect(localStorage.getItem('question_canvas_practice_1')).toBeNull();
  });

});
