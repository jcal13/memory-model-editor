import { CanvasElement } from "../shared/types";
export const assignments = [["a", 5], ["b", 4], ["c", 6]] as const;
export function hasAssignment(elements: CanvasElement[], name: string, value: number) {
  return elements.some(frame => frame.kind.name === "function" && frame.kind.functionName === "__main__" && !frame.invalidated &&
    frame.kind.params.some(param => param.name === name && param.targetId !== null && elements.some(object =>
      !object.invalidated && object.id === param.targetId && object.kind.name === "primitive" && object.kind.type === "int" && object.kind.value.trim() !== "" && Number(object.kind.value) === value)));
}
export function checkTutorial(elements: CanvasElement[]): string[] {
  const errors = assignments.filter(([name, value]) => !hasAssignment(elements, name, value)).map(([name, value]) => `Make ${name} reference an integer object with value ${value}.`);
  const frames = elements.filter(e => e.kind.name === "function");
  if (frames.length !== 1 || frames[0]?.kind.name !== "function" || frames[0].kind.params.length !== 3) errors.push("Keep one __main__ frame with exactly the variables a, b, and c.");
  if (elements.length !== 4) errors.push("Keep exactly three integer objects and the main frame. Remove any extra boxes.");
  const objects = elements.filter(e => e.kind.name !== "function");
  if (objects.some(e => typeof e.id !== "number") || new Set(objects.map(e => e.id)).size !== objects.length) errors.push("Give each integer object its own unique numeric ID.");
  if (elements.some(e => e.invalidated)) errors.push("Repair or remove invalid boxes before checking again.");
  return errors;
}
