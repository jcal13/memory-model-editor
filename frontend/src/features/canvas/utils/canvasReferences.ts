import { CanvasElement, PrimitiveKind } from "../../shared/types";

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

