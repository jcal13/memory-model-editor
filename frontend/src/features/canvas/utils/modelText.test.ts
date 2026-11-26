import { CanvasElement } from "../../shared/types";
import { buildModelOutline, describeChanges, describeSubmission } from "./modelText";

const main = (params: { name: string; targetId: any }[], boxId = 0): CanvasElement => ({
  boxId,
  id: "_",
  x: 0,
  y: 0,
  kind: { name: "function", type: "function", value: null, functionName: "__main__", params },
});
const int = (boxId: number, id: any, value: string): CanvasElement => ({
  boxId, id, x: 0, y: 0, kind: { name: "primitive", type: "int", value },
});
const list = (boxId: number, id: any, value: any[]): CanvasElement => ({
  boxId, id, x: 0, y: 0, kind: { name: "list", type: "list", value },
});

describe("buildModelOutline", () => {
  it("lists frames and objects like the plan's example", () => {
    const outline = buildModelOutline([
      main([{ name: "a", targetId: 1 }, { name: "b", targetId: 2 }]),
      list(2, 2, [3, 4]),
      int(1, 1, "5"),
      { boxId: 3, id: 3, x: 0, y: 0, kind: { name: "primitive", type: "str", value: "hi" } },
      { boxId: 4, id: 4, x: 0, y: 0, kind: { name: "dict", type: "dict", value: { 1: 3 } as any } },
      { boxId: 5, id: "_", x: 0, y: 0, kind: { name: "class", type: "class", value: null, className: "Point", classVariables: [{ name: "x", targetId: 1 }] } },
    ]);
    expect(outline.summary).toBe("1 frame, 5 objects.");
    expect(outline.frames.map((l) => l.text)).toEqual(["__main__: a → id1, b → id2"]);
    expect(outline.objects.map((l) => l.text)).toEqual([
      "id1: int 5",
      "id2: list [id3, id4]",
      'id3: str "hi"',
      "id4: dict {id1: id3}",
      "no id: Point object: x → id1",
    ]);
  });

  it("says when the canvas is empty and marks crossed-out boxes", () => {
    expect(buildModelOutline([]).summary).toBe("The canvas is empty.");
    const crossed = { ...list(1, 1, []), invalidated: true };
    expect(buildModelOutline([crossed]).objects[0].text).toBe("id1: list [] (crossed out)");
    expect(buildModelOutline([main([])]).frames[0].text).toBe("__main__: no variables");
  });

  it("shows values instead of hidden primitive ids in Python Tutor inline mode", () => {
    const els = [main([{ name: "a", targetId: 5 }, { name: "b", targetId: "_" }]), int(1, 5, "42"), list(2, 2, [5])];
    const outline = buildModelOutline(els, { inlinePrimitives: true });
    expect(outline.frames[0].text).toBe("__main__: a → 42, b → empty");
    expect(outline.objects.map((l) => l.text)).toEqual(["id2: list [42]"]);
  });
});

describe("describeChanges", () => {
  it("reports a variable pointing at an object", () => {
    const before = [main([{ name: "a", targetId: "_" }]), int(1, 1, "5")];
    const after = [main([{ name: "a", targetId: 1 }]), before[1]];
    expect(describeChanges(before, after)).toEqual(["a now refers to id1"]);
  });

  it("reports added and removed variables, renames and boxes", () => {
    const m0 = main([{ name: "a", targetId: 1 }]);
    const m1 = main([{ name: "a", targetId: 1 }, { name: "", targetId: "_" }]);
    const m2 = main([{ name: "a", targetId: 1 }, { name: "b", targetId: "_" }]);
    expect(describeChanges([m0], [m1])).toEqual(["Added variable 2 to __main__"]);
    expect(describeChanges([m1], [m2])).toEqual(["Variable 2 is now named b"]);
    expect(describeChanges([m2], [m0])).toEqual(["Removed variable 2 (b) from __main__"]);
    expect(describeChanges([m0], [m0, list(1, 3, [])])).toEqual(["Added list id3"]);
    expect(describeChanges([m0, list(1, 3, [])], [m0])).toEqual(["Deleted list id3"]);
  });

  it("names rows of other frames, lists, dicts and primitives", () => {
    const f = (params: any[]): CanvasElement => ({
      boxId: 9, id: "_", x: 0, y: 0,
      kind: { name: "function", type: "function", value: null, functionName: "f", params },
    });
    expect(describeChanges([f([{ name: "x", targetId: "_" }])], [f([{ name: "x", targetId: 2 }])])).toEqual([
      "x in frame f now refers to id2",
    ]);
    expect(describeChanges([list(1, 3, [1])], [list(1, 3, [2])])).toEqual(["element 1 of list id3 now refers to id2"]);
    expect(describeChanges([list(1, 3, [1])], [list(1, 3, ["_"])])).toEqual(["element 1 of list id3 is now empty"]);
    expect(describeChanges([list(1, 3, [])], [list(1, 3, ["_"])])).toEqual(["Added element 1 to list id3"]);
    expect(describeChanges([int(1, 2, "5")], [int(1, 2, "6")])).toEqual(["int id2 is now 6"]);
    expect(describeChanges([int(1, "_", "5")], [int(1, 4, "5")])).toEqual(["int with no id now has id4"]);
    expect(describeChanges([int(1, 2, "5")], [{ ...int(1, 2, "5"), invalidated: true }])).toEqual(["Crossed out int id2"]);
    const d = (value: any): CanvasElement => ({ boxId: 1, id: 7, x: 0, y: 0, kind: { name: "dict", type: "dict", value } });
    expect(describeChanges([d({ 1: "_" })], [d({ 1: 2 })])).toEqual(["value 1 of dict id7 now refers to id2"]);
  });

  it("ignores moves and validation errors", () => {
    const a = list(1, 3, []);
    expect(describeChanges([a], [{ ...a, x: 50, y: 20 }])).toEqual([]);
    expect(describeChanges([a], [{ ...a, errors: [] as any }])).toEqual([]);
    expect(describeChanges([a], [a])).toEqual([]);
  });

  it("speaks values for Python Tutor inline slots and hides their primitive boxes", () => {
    const before = [main([{ name: "a", targetId: "_" }])];
    const after = [main([{ name: "a", targetId: 5 }]), int(1, 5, "42")];
    expect(describeChanges(before, after, { inlinePrimitives: true })).toEqual(["a is now 42"]);
    // Typing a new value reuses the hidden primitive in place.
    const later = [after[0], int(1, 5, "7")];
    expect(describeChanges(after, later, { inlinePrimitives: true })).toEqual(["a is now 7"]);
  });

  it("summarises big changes such as loading a question", () => {
    const loaded = [1, 2, 3, 4, 5].map((i) => list(i, i, []));
    expect(describeChanges([], loaded)).toEqual(["Canvas updated: 5 boxes added"]);
  });
});

describe("describeSubmission", () => {
  it("reads correct and incorrect results", () => {
    expect(describeSubmission({ correct: true, errors: [] })).toMatch(/Correct/);
    expect(describeSubmission({ correct: false, errors: [{ message: "a should refer to id1" }] })).toBe(
      "Submitted. 1 issue found. First: a should refer to id1"
    );
    expect(describeSubmission({ correct: false, errors: [{ message: "x" }, { message: "y" }] })).toMatch(/2 issues/);
  });
});
