import { spreadOverlappingElements } from "../../canvas/utils/boundary.helpers";
import {
  CanvasElement,
  ID,
  PrimitiveKind,
  PrimitiveType,
} from "../../shared/types";
import {
  createElementsByIdMap,
  getPythonTutorDisplayType,
  isPrimitiveElement,
} from "../../canvas/utils/pythonTutorReferences";

export type InlineTargetValue = ID | string | null | undefined;

const DEFAULT_PRIMITIVE_VALUES: Record<PrimitiveType, string> = {
  NoneType: "None",
  int: "0",
  float: "0.0",
  str: "",
  bool: "false",
};

function getNextBoxId(elements: CanvasElement[]): number {
  const boxIds = elements.map((element) => element.boxId).sort((a, b) => a - b);

  for (let i = 0; i < boxIds.length; i += 1) {
    if (boxIds[i] !== i) {
      return i;
    }
  }

  return boxIds.length;
}

function getNextElementId(elements: CanvasElement[]): number {
  const numericIds = elements
    .map((element) => element.id)
    .filter((id): id is number => typeof id === "number")
    .sort((a, b) => a - b);

  for (let i = 0; i < numericIds.length; i += 1) {
    const expected = i + 1;
    if (numericIds[i] !== expected) {
      return expected;
    }
  }

  return numericIds.length + 1;
}

function collectReferencedIds(elements: CanvasElement[]): Set<number> {
  const referencedIds = new Set<number>();

  const addReference = (value: InlineTargetValue) => {
    const normalized = normalizeInlineTarget(value);
    if (normalized !== null) {
      referencedIds.add(normalized);
    }
  };

  elements.forEach((element) => {
    switch (element.kind.name) {
      case "function":
        element.kind.params.forEach((param) => addReference(param.targetId));
        break;
      case "class":
        element.kind.classVariables.forEach((variable) =>
          addReference(variable.targetId)
        );
        break;
      case "list":
      case "tuple":
      case "set":
        element.kind.value.forEach((value) => addReference(value));
        break;
      case "dict":
        Object.entries(element.kind.value).forEach(([key, value]) => {
          addReference(key);
          addReference(value);
        });
        break;
      default:
        break;
    }
  });

  return referencedIds;
}

function getGeneratedPrimitiveBasePosition(
  ownerElement: CanvasElement
): { x: number; y: number } {
  if (ownerElement.kind.name === "function") {
    return {
      x: Math.max(ownerElement.x || 0, 320) + 40,
      y: Math.max(ownerElement.y || 0, 140),
    };
  }

  return {
    x: Math.max(ownerElement.x + 80, 320),
    y: Math.max(ownerElement.y + 40, 140),
  };
}

export function normalizeInlineTarget(value: InlineTargetValue): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return parseInt(value, 10);
  }

  return null;
}

export function createDefaultPrimitiveKind(type: PrimitiveType): PrimitiveKind {
  return {
    name: "primitive",
    type,
    value: DEFAULT_PRIMITIVE_VALUES[type],
  };
}

export function getReferenceableElements(
  elements: CanvasElement[]
): Array<CanvasElement & { id: number }> {
  return elements
    .filter(
      (element): element is CanvasElement & { id: number } =>
        typeof element.id === "number" && element.kind.name !== "primitive"
    )
    .sort((left, right) => left.id - right.id);
}

export function getReferenceOptionLabel(element: CanvasElement & { id: number }): string {
  return `id${element.id} (${getPythonTutorDisplayType(element)})`;
}

export function upsertInlinePrimitive(options: {
  elements: CanvasElement[];
  ownerElement: CanvasElement;
  currentTarget: InlineTargetValue;
  primitiveKind: PrimitiveKind;
}): {
  elements: CanvasElement[];
  targetId: number;
  created: boolean;
} {
  const { elements, ownerElement, currentTarget, primitiveKind } = options;
  const currentId = normalizeInlineTarget(currentTarget);
  const elementsById = createElementsByIdMap(elements);
  const currentElement = currentId !== null ? elementsById.get(currentId) : undefined;

  if (currentElement && isPrimitiveElement(currentElement)) {
    return {
      elements: elements.map((element) =>
        element.boxId === currentElement.boxId
          ? {
              ...element,
              kind: primitiveKind,
            }
          : element
      ),
      targetId: currentId as number,
      created: false,
    };
  }

  const nextId = getNextElementId(elements);
  const nextBoxId = getNextBoxId(elements);
  const basePosition = getGeneratedPrimitiveBasePosition(ownerElement);
  const generatedElement: CanvasElement = {
    boxId: nextBoxId,
    id: nextId,
    kind: primitiveKind,
    x: basePosition.x,
    y: basePosition.y,
    generatedInlinePrimitive: true,
  };
  const spreadElements = spreadOverlappingElements([...elements, generatedElement]);
  const positionedElement =
    spreadElements.find((element) => element.boxId === nextBoxId) ?? generatedElement;

  return {
    elements: [...elements, positionedElement],
    targetId: nextId,
    created: true,
  };
}

export function findOrphanedGeneratedPrimitiveIds(
  elements: CanvasElement[]
): number[] {
  const referencedIds = collectReferencedIds(elements);

  return elements
    .filter(
      (element): element is CanvasElement & { id: number } =>
        element.kind.name === "primitive" &&
        element.generatedInlinePrimitive === true &&
        typeof element.id === "number" &&
        !referencedIds.has(element.id)
    )
    .map((element) => element.id);
}
