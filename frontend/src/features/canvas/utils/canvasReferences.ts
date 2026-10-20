import { CanvasElement, FunctionParams, PrimitiveKind } from "../../shared/types";

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


// Older saved diagrams and question data use key/value for class attributes.
export function normalizeClassVariable(
  variable: Partial<FunctionParams> & { key?: string; value?: number | null }
): FunctionParams {
  return {
    name: variable.name ?? variable.key ?? "",
    targetId: variable.targetId !== undefined ? variable.targetId : variable.value ?? null,
  };
}
