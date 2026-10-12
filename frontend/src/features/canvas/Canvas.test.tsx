import React, { useEffect, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import Canvas from "./Canvas";
import { useUndoHistory } from "../memoryModelEditor/hooks/useUndoHistory";
import { CanvasElement } from "../shared/types";

jest.mock("./components/CanvasBox", () => ({
  __esModule: true,
  default: ({ element }: { element: CanvasElement }) => (
    <g data-testid={`canvas-box-${element.boxId}`} />
  ),
}));

jest.mock("./components/CallStack", () => ({
  __esModule: true,
  default: () => <g data-testid="call-stack-layer" />,
}));

jest.mock("./components/PythonTutorReferenceArrows", () => ({
  __esModule: true,
  default: ({ enabled }: { enabled: boolean }) =>
    enabled ? <g data-testid="arrow-overlay-layer" /> : null,
}));

jest.mock("./utils/validation", () => ({
  validateElements: (elements: CanvasElement[]) => elements,
}));

jest.mock("../editors/utils/pythonTutorInlinePrimitives", () => ({
  findOrphanedGeneratedPrimitiveIds: () => [],
}));

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

describe("Canvas arrow overlay order", () => {
  beforeAll(() => {
    (global as typeof globalThis).ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  it("renders the arrow overlay after the object layer so arrows paint on top", () => {
    const elements: CanvasElement[] = [
      {
        boxId: 1,
        id: "_",
        x: 100,
        y: 100,
        kind: {
          name: "function",
          type: "function",
          value: null,
          functionName: "__main__",
          params: [{ name: "node", targetId: 2 }],
        },
      },
      {
        boxId: 2,
        id: 2,
        x: 250,
        y: 120,
        kind: {
          name: "class",
          type: "class",
          value: null,
          className: "Node",
          classVariables: [],
        },
      },
    ];

    const setElements = jest.fn();
    const svgPoint = {
      x: 0,
      y: 0,
      matrixTransform: () => ({ x: 0, y: 0 }),
    };

    render(
      <Canvas
        elements={elements}
        setElements={setElements}
        ids={[2]}
        addId={jest.fn()}
        removeId={jest.fn()}
        onClear={jest.fn()}
        visualStyle="pythonTutor"
        pythonTutorReferenceArrows={true}
      />
    );

    const svg = screen.getByTestId("canvas") as unknown as SVGSVGElement;
    svg.getBoundingClientRect = () =>
      ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    svg.createSVGPoint = () => svgPoint as SVGPoint;

    const overlay = screen.getByTestId("arrow-overlay-layer");
    const objectBox = screen.getByTestId("canvas-box-2");
    const objectLayer = objectBox.parentElement;

    expect(objectLayer?.tagName.toLowerCase()).toBe("g");

    const svgChildren = Array.from(svg.children);
    expect(svgChildren.indexOf(objectLayer as Element)).toBeGreaterThanOrEqual(0);
    expect(svgChildren.indexOf(overlay)).toBeGreaterThan(
      svgChildren.indexOf(objectLayer as Element)
    );
  });

  it("hides primitive objects in inline Python Tutor mode but shows them in standalone mode", () => {
    const primitiveElement: CanvasElement = {
      boxId: 2,
      id: 2,
      x: 250,
      y: 120,
      kind: {
        name: "primitive",
        type: "int",
        value: "7",
      },
    };

    const { rerender } = render(
      <Canvas
        elements={[primitiveElement]}
        setElements={jest.fn()}
        ids={[2]}
        addId={jest.fn()}
        removeId={jest.fn()}
        onClear={jest.fn()}
        visualStyle="pythonTutor"
        pythonTutorStandalonePrimitives={false}
      />
    );

    expect(screen.queryByTestId("canvas-box-2")).toBeNull();

    rerender(
      <Canvas
        elements={[primitiveElement]}
        setElements={jest.fn()}
        ids={[2]}
        addId={jest.fn()}
        removeId={jest.fn()}
        onClear={jest.fn()}
        visualStyle="pythonTutor"
        pythonTutorStandalonePrimitives={true}
      />
    );

    expect(screen.getByTestId("canvas-box-2")).toBeInTheDocument();
  });

  it("blocks primitive drops in inline Python Tutor mode and allows them in standalone mode", () => {
    const dataTransfer = {
      getData: () => "int",
    } as unknown as DataTransfer;
    const svgPoint = {
      x: 0,
      y: 0,
      matrixTransform: () => ({ x: 100, y: 120 }),
    };
    const setElements = jest.fn();

    const { rerender } = render(
      <Canvas
        elements={[]}
        setElements={setElements}
        ids={[]}
        addId={jest.fn()}
        removeId={jest.fn()}
        onClear={jest.fn()}
        visualStyle="pythonTutor"
        pythonTutorStandalonePrimitives={false}
      />
    );

    let svg = screen.getByTestId("canvas") as unknown as SVGSVGElement;
    svg.createSVGPoint = () => svgPoint as SVGPoint;
    svg.getScreenCTM = () =>
      ({
        inverse: () => ({}),
      }) as SVGMatrix;

    fireEvent.drop(svg, {
      dataTransfer,
      clientX: 100,
      clientY: 120,
    });

    expect(setElements).not.toHaveBeenCalled();

    rerender(
      <Canvas
        elements={[]}
        setElements={setElements}
        ids={[]}
        addId={jest.fn()}
        removeId={jest.fn()}
        onClear={jest.fn()}
        visualStyle="pythonTutor"
        pythonTutorStandalonePrimitives={true}
      />
    );

    svg = screen.getByTestId("canvas") as unknown as SVGSVGElement;
    svg.createSVGPoint = () => svgPoint as SVGPoint;
    svg.getScreenCTM = () =>
      ({
        inverse: () => ({}),
      }) as SVGMatrix;

    fireEvent.drop(svg, {
      dataTransfer,
      clientX: 100,
      clientY: 120,
    });

    expect(setElements).toHaveBeenCalledTimes(1);
  });
});


describe("Canvas drop history", () => {
  beforeEach(() => {
    localStorage.clear();
    global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  it.each([false, true])("undoes a dropped box in one action (sandbox=%s)", async (sandbox) => {
    function Harness() {
      const [elements, setElements] = useState<CanvasElement[]>([]);
      const [ids, setIds] = useState<number[]>([]);
      const [classes, setClasses] = useState<string[]>([]);
      const { recordState, undo, redo, canUndo, canRedo } = useUndoHistory(setElements, setIds, setClasses);
      useEffect(() => { recordState({ elements, ids, classes }); }, [elements, ids, classes, recordState]);
      return <>
        <button onClick={undo} disabled={!canUndo}>Undo drop</button>
        <button onClick={redo} disabled={!canRedo}>Redo drop</button>
        <output data-testid="ids">{JSON.stringify(ids)}</output>
        <Canvas elements={elements} setElements={setElements} ids={ids}
          addId={id => setIds(previous => [...previous, id])}
          removeId={id => setIds(previous => previous.filter(value => value !== id))}
          onClear={() => {}} sandbox={sandbox} />
      </>;
    }
    render(<Harness />);
    const svg = screen.getByTestId("canvas") as unknown as SVGSVGElement;
    Object.defineProperty(svg, "viewBox", { value: { baseVal: { width: 800, height: 600, x: 0, y: 0 } } });
    svg.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform: () => ({ x: 200, y: 100 }) }) as SVGPoint;
    svg.getScreenCTM = () => ({ inverse: () => ({}) }) as SVGMatrix;
    fireEvent.drop(svg, { dataTransfer: { getData: () => "int" }, clientX: 200, clientY: 100 });
    expect(screen.getAllByTestId(/^canvas-box-/)).toHaveLength(1);
    expect(screen.getByTestId("ids")).toHaveTextContent(sandbox ? "[]" : "[1]");
    fireEvent.click(screen.getByText("Undo drop"));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(screen.queryAllByTestId(/^canvas-box-/)).toHaveLength(0);
    expect(screen.getByTestId("ids")).toHaveTextContent("[]");
    fireEvent.click(screen.getByText("Redo drop"));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(screen.getAllByTestId(/^canvas-box-/)).toHaveLength(1);
    expect(screen.getByTestId("ids")).toHaveTextContent(sandbox ? "[]" : "[1]");
  });
});
