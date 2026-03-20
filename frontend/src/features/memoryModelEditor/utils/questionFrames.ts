import { CanvasElement, BoxType } from "../../shared/types";
import type { CanvasData } from "./localStorage";

export const QUESTION_MAIN_FRAME_NAME = "__main__";
type FunctionFrameElement = CanvasElement & {
  kind: Extract<BoxType, { name: "function" }>;
};

function cloneKind(kind: BoxType): BoxType {
  switch (kind.name) {
    case "primitive":
      return { ...kind };
    case "function":
      return {
        ...kind,
        params: kind.params.map((param) => ({ ...param })),
      };
    case "list":
    case "tuple":
    case "set":
      return {
        ...kind,
        value: [...kind.value],
      };
    case "dict":
      return {
        ...kind,
        value: { ...kind.value },
      };
    case "class":
      return {
        ...kind,
        classVariables: kind.classVariables.map((variable) => ({ ...variable })),
      };
  }
}

function cloneElement(element: CanvasElement): CanvasElement {
  return {
    ...element,
    errors: element.errors ? [...element.errors] : undefined,
    kind: cloneKind(element.kind),
  };
}

function getNextBoxId(elements: CanvasElement[]): number {
  const usedIds = new Set(elements.map((element) => element.boxId));
  let nextId = 0;

  while (usedIds.has(nextId)) {
    nextId += 1;
  }

  return nextId;
}

function createLockedMainFrame(elements: CanvasElement[]): FunctionFrameElement {
  return {
    boxId: getNextBoxId(elements),
    id: "_",
    x: 0,
    y: 0,
    kind: {
      name: "function",
      type: "function",
      value: null,
      functionName: QUESTION_MAIN_FRAME_NAME,
      params: [],
    },
    questionFrameRole: "main",
    invalidated: false,
  };
}

export function isLockedMainFrame(
  element: Pick<CanvasElement, "kind" | "questionFrameRole"> | null | undefined
): boolean {
  return !!element && element.kind.name === "function" && element.questionFrameRole === "main";
}

export function normalizeQuestionCanvasData(
  data?: CanvasData | null
): CanvasData {
  const safeData = data ?? { elements: [], ids: [], classes: [] };
  const rawElements = Array.isArray(safeData.elements) ? safeData.elements : [];
  const rawIds = Array.isArray(safeData.ids) ? safeData.ids : [];
  const rawClasses = Array.isArray(safeData.classes) ? safeData.classes : [];

  const elements = rawElements.map(cloneElement);
  const ids = [...rawIds];
  const classes = [...rawClasses];

  const functionElements = elements.filter(
    (element): element is FunctionFrameElement => element.kind.name === "function"
  );
  const otherElements = elements.filter((element) => element.kind.name !== "function");

  const protectedMain: FunctionFrameElement =
    functionElements.find((element) => element.questionFrameRole === "main") ??
    functionElements.find(
      (element) => element.kind.functionName === QUESTION_MAIN_FRAME_NAME
    ) ??
    createLockedMainFrame(elements);

  const normalizedFunctions = [
    {
      ...protectedMain,
      questionFrameRole: "main" as const,
      invalidated: false,
      kind: {
        ...protectedMain.kind,
        functionName: QUESTION_MAIN_FRAME_NAME,
        params: protectedMain.kind.params.map((param) => ({ ...param })),
      },
    },
    ...functionElements
      .filter((element) => element.boxId !== protectedMain.boxId)
      .map((element) => ({
        ...element,
        questionFrameRole: undefined,
        kind: {
          ...element.kind,
          params: element.kind.params.map((param) => ({ ...param })),
        },
      })),
  ];

  return {
    elements: [...normalizedFunctions, ...otherElements],
    ids,
    classes,
  };
}

export function reorderFunctionFramesWithLockedMain(
  elements: CanvasElement[],
  fromIndex: number,
  toIndex: number
): CanvasElement[] {
  if (fromIndex === toIndex) {
    return elements;
  }

  const functionIndices = elements
    .map((element, index) => ({ element, index }))
    .filter(({ element }) => element.kind.name === "function");

  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= functionIndices.length ||
    toIndex >= functionIndices.length
  ) {
    return elements;
  }

  const lockedMainIndex = functionIndices.findIndex(({ element }) =>
    isLockedMainFrame(element)
  );

  if (lockedMainIndex === fromIndex) {
    return elements;
  }

  const safeToIndex =
    lockedMainIndex === 0 ? Math.max(1, toIndex) : toIndex;

  if (fromIndex === safeToIndex) {
    return elements;
  }

  const sourceIndex = functionIndices[fromIndex].index;
  const targetIndex = functionIndices[safeToIndex].index;
  const reordered = [...elements];
  const [movedElement] = reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, movedElement);

  return reordered;
}
