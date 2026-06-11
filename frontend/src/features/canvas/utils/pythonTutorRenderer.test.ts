import { CanvasElement } from "../../shared/types";
import { createPythonTutorBoxRenderer } from "./pythonTutorRenderer";

function createFrameElement(
  params: Array<{ name: string; targetId: number | null }>
): CanvasElement {
  return {
    boxId: 1,
    id: "_",
    x: 0,
    y: 0,
    kind: {
      name: "function",
      type: "function",
      value: null,
      functionName: "__main__",
      params,
    },
  };
}

describe("createPythonTutorBoxRenderer", () => {
  it("replaces non-primitive reference labels with source markers in arrow mode", () => {
    const objectElement: CanvasElement = {
      boxId: 2,
      id: 2,
      x: 0,
      y: 0,
      kind: {
        name: "class",
        type: "class",
        value: null,
        className: "Node",
        classVariables: [],
      },
    };
    const primitiveElement: CanvasElement = {
      boxId: 3,
      id: 3,
      x: 0,
      y: 0,
      kind: {
        name: "primitive",
        type: "int",
        value: "7",
      },
    };
    const elementsById = new Map<number, CanvasElement>([
      [2, objectElement],
      [3, primitiveElement],
    ]);
    const svg = createPythonTutorBoxRenderer(
      createFrameElement([
        { name: "obj", targetId: 2 },
        { name: "count", targetId: 3 },
        { name: "missing", targetId: 99 },
      ]),
      {
        elementsById,
        renderMode: "canvas",
        showReferenceArrows: true,
      }
    );

    expect(svg.textContent).not.toContain("id2");
    expect(svg.textContent).toContain("7");
    expect(svg.textContent).toContain("unknown id99");
    expect(svg.querySelector('[data-ref-source-target-id="2"]')).not.toBeNull();
    expect(svg.querySelector('[data-ref-source-target-id="3"]')).toBeNull();
    expect(svg.querySelector('[data-ref-source-target-id="99"]')).toBeNull();
  });

  it("keeps inline id labels when arrow mode is off", () => {
    const objectElement: CanvasElement = {
      boxId: 2,
      id: 2,
      x: 0,
      y: 0,
      kind: {
        name: "class",
        type: "class",
        value: null,
        className: "Node",
        classVariables: [],
      },
    };
    const svg = createPythonTutorBoxRenderer(
      createFrameElement([{ name: "obj", targetId: 2 }]),
      {
        elementsById: new Map([[2, objectElement]]),
        renderMode: "canvas",
        showReferenceArrows: false,
      }
    );

    expect(svg.textContent).toContain("id2");
    expect(svg.querySelector('[data-ref-source-target-id="2"]')).toBeNull();
  });

  it("renders primitive targets as references in standalone mode", () => {
    const primitiveElement: CanvasElement = {
      boxId: 3,
      id: 3,
      x: 0,
      y: 0,
      kind: {
        name: "primitive",
        type: "int",
        value: "7",
      },
    };
    const svg = createPythonTutorBoxRenderer(
      createFrameElement([{ name: "count", targetId: 3 }]),
      {
        elementsById: new Map([[3, primitiveElement]]),
        renderMode: "canvas",
        showReferenceArrows: false,
        showPrimitiveReferencesAsObjects: true,
      }
    );

    expect(svg.textContent).toContain("id3");
    expect(svg.textContent).not.toContain("7");

    const arrowSvg = createPythonTutorBoxRenderer(
      createFrameElement([{ name: "count", targetId: 3 }]),
      {
        elementsById: new Map([[3, primitiveElement]]),
        renderMode: "canvas",
        showReferenceArrows: true,
        showPrimitiveReferencesAsObjects: true,
      }
    );

    expect(arrowSvg.textContent).not.toContain("id3");
    expect(arrowSvg.querySelector('[data-ref-source-target-id="3"]')).not.toBeNull();
  });
});
