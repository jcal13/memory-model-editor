import { CanvasElement } from "../shared/types";

/** Keep repair instructions and the spotlight on the same existing model element. */
export function assignmentRepair(step: number, elements: CanvasElement[]) {
  const name = step === 4 ? "b" : step === 5 ? "c" : "a";
  const value = name === "b" ? 4 : name === "c" ? 6 : 5;
  const main = elements.find(e => e.kind.name === "function" && e.kind.functionName === "__main__" && !e.invalidated);
  const params = main?.kind.name === "function" ? main.kind.params : [];
  const variable = params.find(p => p.name === name);
  const integers = elements.filter(e => !e.invalidated && e.kind.name === "primitive" && e.kind.type === "int");
  const bound = variable?.targetId == null ? undefined : integers.find(e => e.id === variable.targetId);
  const shared = bound && params.some(p => p.name !== name && p.targetId === bound.id);
  const matching = integers.find(e => e.kind.name === "primitive" && e.kind.value.trim() !== "" && Number(e.kind.value) === value);
  const unused = integers.find(e => !params.some(p => p.targetId === e.id));
  const object = (!shared ? bound : undefined) || matching || unused;
  const ready = object?.kind.name === "primitive" && object.kind.value.trim() !== "" && Number(object.kind.value) === value;
  if (object && !ready) return {
    target: object, reference: false,
    text: `Change the value of the existing integer object (ID ${object.id}) to ${value}. ${bound === object ? `Keep ${name} connected to this object.` : `Then connect ${name} to this object in __main__.`} You do not need another integer.`,
  };
  if (ready && main) return {
    target: main, reference: true,
    text: variable
      ? variable.targetId === object!.id
        ? `${name} already points to the integer containing ${value} (ID ${object!.id}). This assignment is complete; you do not need another variable or object.`
        : `In __main__, change the existing variable ${name} to reference ID ${object!.id}, the integer containing ${value}. Do not add another variable.`
      : `In __main__, add variable ${name} and select ID ${object!.id}, the integer containing ${value}. You do not need another integer.`,
  };
  if (!main && (step === 3 || ready)) return {
    target: undefined, reference: true,
    text: "Restore the __main__ frame using Undo, or reset the question to restore its starting frame.",
  };
  return {
    target: undefined, reference: false,
    text: `Add an integer object and set its value to ${value}. Then ${variable ? `update the existing variable ${name} in __main__ to reference it; do not add another variable` : `add variable ${name} in __main__ and reference it`}.${shared ? " Keep the shared object unchanged for the other variables." : ""}`,
  };
}
