import { normalizeClassVariable } from "./canvasReferences";
import { getHiddenPrimitiveIds } from "./pythonTutorReferences";
import { findOrphanedGeneratedPrimitiveIds } from "../../editors/utils/pythonTutorInlinePrimitives";
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

// Authored prep questions and older saved diagrams use key/value attributes.
describe("legacy class attributes", () => {
  it.each([false, true])("renders key/value attributes with arrows=%s", (showReferenceArrows) => {
    const object = {
      boxId: 4, id: 4, x: 0, y: 0,
      kind: { name: "class", type: "class", value: null, className: "_Node",
        classVariables: [{ key: "item", value: 5 }, { key: "next", value: 6 }, {}] },
    } as unknown as CanvasElement;
    const primitive: CanvasElement = {
      boxId: 5, id: 5, x: 0, y: 0,
      kind: { name: "primitive", type: "int", value: "7" },
    };
    const next: CanvasElement = {
      boxId: 6, id: 6, x: 0, y: 0,
      kind: { name: "class", type: "class", value: null, className: "_Node", classVariables: [] },
    };
    primitive.generatedInlinePrimitive = true;
    expect(getHiddenPrimitiveIds([object, primitive, next])).toEqual(new Set([5]));
    expect(findOrphanedGeneratedPrimitiveIds([object, primitive, next])).toEqual([]);
    const original = JSON.stringify(object);
    const svg = createPythonTutorBoxRenderer(object, {
      elementsById: new Map([[5, primitive], [6, next]]), renderMode: "canvas", showReferenceArrows,
    });
    expect(svg.textContent).toContain("item");
    expect(svg.textContent).toContain("next");
    expect(svg.textContent).toContain("7");
    expect(Number(svg.getAttribute("width"))).toBeGreaterThan(0);
    if (showReferenceArrows) {
      expect(svg.querySelector('[data-ref-source-target-id="6"]')).not.toBeNull();
    } else {
      expect(svg.textContent).toContain("id6");
    }
    expect(JSON.stringify(object)).toBe(original);
  });
});

test("normalizing legacy attributes preserves explicit empty names and cleared references", () => {
  expect(normalizeClassVariable({ name: "", targetId: null, key: "old", value: 5 }))
    .toEqual({ name: "", targetId: null });
  expect(normalizeClassVariable({ key: "zero", value: 0 }))
    .toEqual({ name: "zero", targetId: 0 });
});
