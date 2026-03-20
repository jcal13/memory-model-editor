import {
  BoxTypeName,
  CanvasElement,
  PrimitiveKind,
  RenderMode,
} from "../../shared/types";

type ReferenceTarget = number | string | null | "_" | undefined;

export interface PythonTutorReferenceDisplay {
  kind: "blank" | "primitive" | "reference" | "unknown";
  label: string;
  targetId: number | null;
}

interface ResolveInlineDisplayOptions {
  showPrimitiveReferencesAsObjects?: boolean;
}

function normalizeNumericId(value: ReferenceTarget): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  return null;
}

function createElement(
  boxId: number,
  id: number | "_",
  kind: CanvasElement["kind"]
): CanvasElement {
  return {
    boxId,
    id,
    kind,
    x: 0,
    y: 0,
  };
}

function collectReferencedIds(elements: CanvasElement[]): Set<number> {
  const referencedIds = new Set<number>();

  const addReference = (target: ReferenceTarget) => {
    const numericId = normalizeNumericId(target);
    if (numericId !== null) {
      referencedIds.add(numericId);
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

export function getPythonTutorFrameTitle(functionName: string): string {
  return functionName === "__main__" ? "Global frame" : functionName || "Frame";
}

export function isPrimitiveElement(
  element: CanvasElement | null | undefined
): element is CanvasElement & { kind: PrimitiveKind } {
  return element?.kind.name === "primitive";
}

export function formatPrimitiveValue(kind: PrimitiveKind): string {
  if (kind.type === "NoneType") {
    return "None";
  }

  if (kind.type === "bool") {
    return kind.value === "true" ? "True" : "False";
  }

  if (kind.type === "str") {
    return JSON.stringify(kind.value ?? "");
  }

  return `${kind.value ?? ""}`;
}

export function resolveInlineDisplay(
  targetId: ReferenceTarget,
  elementsById?: Map<number, CanvasElement>,
  options: ResolveInlineDisplayOptions = {}
): PythonTutorReferenceDisplay {
  const numericId = normalizeNumericId(targetId);

  if (numericId === null) {
    return {
      kind: "blank",
      label: "",
      targetId: null,
    };
  }

  const target = elementsById?.get(numericId);
  if (!target) {
    return {
      kind: "unknown",
      label: `unknown id${numericId}`,
      targetId: numericId,
    };
  }

  if (isPrimitiveElement(target)) {
    if (options.showPrimitiveReferencesAsObjects) {
      return {
        kind: "reference",
        label: `id${numericId}`,
        targetId: numericId,
      };
    }

    return {
      kind: "primitive",
      label: formatPrimitiveValue(target.kind),
      targetId: numericId,
    };
  }

  return {
    kind: "reference",
    label: `id${numericId}`,
    targetId: numericId,
  };
}

export function getHiddenPrimitiveIds(elements: CanvasElement[]): Set<number> {
  const elementsById = createElementsByIdMap(elements);
  const referencedIds = collectReferencedIds(elements);
  const hiddenPrimitiveIds = new Set<number>();

  referencedIds.forEach((id) => {
    if (isPrimitiveElement(elementsById.get(id))) {
      hiddenPrimitiveIds.add(id);
    }
  });

  return hiddenPrimitiveIds;
}

export function getPythonTutorDisplayType(
  element: CanvasElement | null | undefined
): string {
  if (!element) return "unknown";

  switch (element.kind.name) {
    case "primitive":
      return element.kind.type === "NoneType" ? "None" : element.kind.type;
    case "list":
    case "tuple":
    case "set":
    case "dict":
      return element.kind.type;
    case "class":
      return element.kind.className || "object";
    case "function":
      return "function";
    default:
      return "unknown";
  }
}

export function createElementsByIdMap(
  elements: CanvasElement[]
): Map<number, CanvasElement> {
  return new Map(
    elements
      .filter((element): element is CanvasElement & { id: number } =>
        typeof element.id === "number"
      )
      .map((element) => [element.id, element])
  );
}

export function createPythonTutorPalettePreview(
  boxType: BoxTypeName,
  renderMode: RenderMode = "palette"
): {
  element: CanvasElement;
  elementsById: Map<number, CanvasElement>;
  renderMode: RenderMode;
} {
  const elementsById = new Map<number, CanvasElement>();

  switch (boxType) {
    case "function":
      return {
        element: createElement(1, "_", {
          name: "function",
          type: "function",
          value: null,
          functionName: "NoFunction",
          params: [],
        }),
        elementsById,
        renderMode,
      };
    case "class":
      return {
        element: createElement(2, 1, {
          name: "class",
          type: "class",
          value: null,
          className: "NoClass",
          classVariables: [],
        }),
        elementsById,
        renderMode,
      };
    case "none":
      return {
        element: createElement(3, 1, {
          name: "primitive",
          type: "NoneType",
          value: "None",
        }),
        elementsById,
        renderMode,
      };
    case "int":
      return {
        element: createElement(4, 1, {
          name: "primitive",
          type: "int",
          value: "0",
        }),
        elementsById,
        renderMode,
      };
    case "float":
      return {
        element: createElement(5, 1, {
          name: "primitive",
          type: "float",
          value: "0.0",
        }),
        elementsById,
        renderMode,
      };
    case "str":
      return {
        element: createElement(6, 1, {
          name: "primitive",
          type: "str",
          value: "hello",
        }),
        elementsById,
        renderMode,
      };
    case "bool":
      return {
        element: createElement(7, 1, {
          name: "primitive",
          type: "bool",
          value: "false",
        }),
        elementsById,
        renderMode,
      };
    case "list":
      return {
        element: createElement(8, 1, {
          name: "list",
          type: "list",
          value: [],
        }),
        elementsById,
        renderMode,
      };
    case "tuple":
      return {
        element: createElement(9, 1, {
          name: "tuple",
          type: "tuple",
          value: [],
        }),
        elementsById,
        renderMode,
      };
    case "set":
      return {
        element: createElement(10, 1, {
          name: "set",
          type: "set",
          value: [],
        }),
        elementsById,
        renderMode,
      };
    case "dict":
      return {
        element: createElement(11, 1, {
          name: "dict",
          type: "dict",
          value: {},
        }),
        elementsById,
        renderMode,
      };
    default:
      return {
        element: createElement(12, 1, {
          name: "primitive",
          type: "int",
          value: "0",
        }),
        elementsById,
        renderMode,
      };
  }
}
