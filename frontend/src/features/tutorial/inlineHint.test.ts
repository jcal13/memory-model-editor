import { inlineHint } from "./Tutorial";

const main = (params: { name: string; targetId: number | null }[]) =>
  ({ boxId: 0, id: "_", x: 0, y: 0, kind: { name: "function", type: ".class", value: null, functionName: "__main__", params } }) as any;
const int = (boxId: number, value: string) =>
  ({ boxId, id: boxId, x: 0, y: 0, kind: { name: "primitive", type: "int", value } }) as any;

describe("inline editing hints in the tutorial", () => {
  it("explains how to edit a value on the canvas", () => {
    expect(inlineHint(2, [main([]), int(1, "0")])).toMatch(/click the value/);
  });
  it("explains the frame's + when a variable is needed", () => {
    expect(inlineHint(3, [main([]), int(1, "5")])).toMatch(/click the \+/);
  });
  it("mentions + since the guide focuses __main__", () => {
    expect(inlineHint(3, [main([]), int(1, "5")])).toMatch(/press \+/);
  });
  it("points at the ID slot when the variable already exists", () => {
    const hint = inlineHint(3, [main([{ name: "a", targetId: null }]), int(1, "5")]);
    expect(hint).toMatch(/ID slot/);
    expect(hint).not.toMatch(/press \+/);
  });
  it("mentions N for adding an int from the keyboard", () => {
    expect(inlineHint(4, [main([{ name: "a", targetId: 1 }]), int(1, "5")])).toMatch(/press N/);
  });
  it("adds nothing once the assignment is complete", () => {
    expect(inlineHint(3, [main([{ name: "a", targetId: 1 }]), int(1, "5")])).toBe("");
  });
});

describe("connecting variables: typing first, then dragging", () => {
  it("teaches typing for a, offers dragging for b, and suggests it for c", () => {
    const els = [main([]), int(1, "5"), int(2, "4"), int(3, "6")];
    expect(inlineHint(3, els)).not.toMatch(/drag/i);
    expect(inlineHint(4, els)).toMatch(/Or, instead of typing the ID, drag/);
    expect(inlineHint(5, els)).toMatch(/try dragging/);
  });
});
