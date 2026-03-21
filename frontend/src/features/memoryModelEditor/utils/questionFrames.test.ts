import { CanvasElement } from "../../shared/types";
import {
  QUESTION_MAIN_FRAME_NAME,
  normalizeQuestionCanvasData,
  reorderFunctionFramesWithLockedMain,
} from "./questionFrames";

function createFunctionFrame(
  boxId: number,
  functionName: string,
  questionFrameRole?: "main"
): CanvasElement & {
  kind: Extract<CanvasElement["kind"], { name: "function" }>;
} {
  return {
    boxId,
    id: "_",
    x: 0,
    y: 0,
    kind: {
      name: "function",
      type: "function",
      value: null,
      functionName,
      params: [],
    },
    questionFrameRole,
  };
}

function createPrimitive(boxId: number, id: number): CanvasElement {
  return {
    boxId,
    id,
    x: 300,
    y: 200,
    kind: {
      name: "primitive",
      type: "int",
      value: String(id),
    },
  };
}

function isFunctionFrame(
  element: CanvasElement
): element is CanvasElement & {
  kind: Extract<CanvasElement["kind"], { name: "function" }>;
} {
  return element.kind.name === "function";
}

describe("normalizeQuestionCanvasData", () => {
  it("injects a blank protected __main__ frame into an empty question canvas", () => {
    const normalized = normalizeQuestionCanvasData({
      elements: [],
      ids: [],
      classes: [],
    });

    expect(normalized.elements).toHaveLength(1);
    expect(normalized.elements[0]).toMatchObject({
      questionFrameRole: "main",
      invalidated: false,
      kind: {
        name: "function",
        functionName: QUESTION_MAIN_FRAME_NAME,
        params: [],
      },
    });
  });

  it("preserves an existing preloaded __main__ frame and locks it", () => {
    const preloadedMain = createFunctionFrame(4, QUESTION_MAIN_FRAME_NAME);
    preloadedMain.kind.params = [{ name: "x", targetId: 1 }];
    preloadedMain.invalidated = true;

    const normalized = normalizeQuestionCanvasData({
      elements: [preloadedMain, createPrimitive(1, 1)],
      ids: [1],
      classes: [],
    });

    expect(normalized.elements[0]).toMatchObject({
      boxId: 4,
      questionFrameRole: "main",
      invalidated: false,
      kind: {
        functionName: QUESTION_MAIN_FRAME_NAME,
        params: [{ name: "x", targetId: 1 }],
      },
    });
  });

  it("repairs saved question canvases missing __main__ without dropping other elements", () => {
    const fooFrame = createFunctionFrame(1, "foo");
    const primitive = createPrimitive(2, 7);

    const normalized = normalizeQuestionCanvasData({
      elements: [fooFrame, primitive],
      ids: [7],
      classes: ["Thing"],
    });

    expect(normalized.ids).toEqual([7]);
    expect(normalized.classes).toEqual(["Thing"]);
    expect(
      normalized.elements.filter((element) => element.kind.name === "function")
    ).toHaveLength(2);
    expect(
      normalized.elements.find((element) => element.kind.name !== "function")
    ).toMatchObject(primitive);
    expect(normalized.elements[0]).toMatchObject({
      questionFrameRole: "main",
      kind: {
        functionName: QUESTION_MAIN_FRAME_NAME,
        params: [],
      },
    });
  });

  it("keeps the protected main frame first among function frames", () => {
    const normalized = normalizeQuestionCanvasData({
      elements: [
        createFunctionFrame(1, "alpha"),
        createFunctionFrame(2, QUESTION_MAIN_FRAME_NAME),
        createFunctionFrame(3, "beta"),
      ],
      ids: [],
      classes: [],
    });

    const functionNames = normalized.elements
      .filter(isFunctionFrame)
      .map((element) => element.kind.functionName);

    expect(functionNames).toEqual([
      QUESTION_MAIN_FRAME_NAME,
      "alpha",
      "beta",
    ]);
  });
});

describe("reorderFunctionFramesWithLockedMain", () => {
  it("does not move the protected main frame", () => {
    const elements = [
      createFunctionFrame(0, QUESTION_MAIN_FRAME_NAME, "main"),
      createFunctionFrame(1, "foo"),
      createFunctionFrame(2, "bar"),
      createPrimitive(3, 1),
    ];

    const reordered = reorderFunctionFramesWithLockedMain(elements, 0, 2);

    expect(reordered).toEqual(elements);
  });

  it("still reorders non-main frames above the protected main frame", () => {
    const elements = [
      createFunctionFrame(0, QUESTION_MAIN_FRAME_NAME, "main"),
      createFunctionFrame(1, "foo"),
      createFunctionFrame(2, "bar"),
      createPrimitive(3, 1),
    ];

    const reordered = reorderFunctionFramesWithLockedMain(elements, 2, 0);
    const functionNames = reordered
      .filter(isFunctionFrame)
      .map((element) => element.kind.functionName);

    expect(functionNames).toEqual([
      QUESTION_MAIN_FRAME_NAME,
      "bar",
      "foo",
    ]);
  });
});
