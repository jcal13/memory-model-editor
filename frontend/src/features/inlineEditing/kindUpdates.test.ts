import {
  addSlot,
  applyFieldText,
  applyRef,
  getSlotTarget,
  initialText,
  parsePythonLiteral,
  parseIdInput,
  removeSlot,
} from "./kindUpdates";
import { extractDictionary } from "../canvas/utils/box.helpers";
import { BoxType } from "../shared/types";

const kindOf = (r: ReturnType<typeof applyFieldText>) => {
  if ("error" in r) throw new Error(r.error);
  return r.kind as any;
};

describe("parseIdInput", () => {
  it("accepts bare numbers, id-prefixed numbers and blanks", () => {
    expect(parseIdInput("3")).toBe(3);
    expect(parseIdInput(" id12 ")).toBe(12);
    expect(parseIdInput("")).toBe("_");
    expect(parseIdInput("id_")).toBe("_");
    expect(parseIdInput("x")).toBeNull();
  });
});

describe("primitive edits", () => {
  const int: BoxType = { name: "primitive", type: "int", value: "5" };

  it("validates per type", () => {
    expect(kindOf(applyFieldText(int, { type: "value" }, "007")).value).toBe("7");
    expect("error" in applyFieldText(int, { type: "value" }, "4.5")).toBe(true);
    const float: BoxType = { name: "primitive", type: "float", value: "0.0" };
    expect(kindOf(applyFieldText(float, { type: "value" }, "3")).value).toBe("3.0");
    const str: BoxType = { name: "primitive", type: "str", value: "" };
    expect(kindOf(applyFieldText(str, { type: "value" }, '"hi"')).value).toBe("hi");
  });

  it("converts the value when the type changes", () => {
    const k = kindOf(applyFieldText(int, { type: "typeLabel" }, "float"));
    expect(k).toMatchObject({ type: "float", value: "5.0" });
    expect(kindOf(applyFieldText(int, { type: "typeLabel" }, "NoneType")).value).toBe("None");
  });
});

describe("sequence edits", () => {
  const list: BoxType = { name: "list", type: "list", value: [1, 3] };

  it("sets, adds and removes slots", () => {
    expect(kindOf(applyFieldText(list, { type: "item", index: 1 }, "id7")).value).toEqual([1, 7]);
    const added = addSlot(list)!;
    expect(added.kind).toMatchObject({ value: [1, 3, "_"] });
    expect(added.next).toEqual({ type: "item", index: 2 });
    expect((removeSlot(list, { type: "item", index: 0 }) as any).value).toEqual([3]);
  });

  it("rejects duplicate set members", () => {
    const set: BoxType = { name: "set", type: "set", value: [1, 2] };
    expect("error" in applyRef(set, { type: "item", index: 1 }, 1)).toBe(true);
  });
});

describe("named rows (class / function)", () => {
  const cls: BoxType = {
    name: "class",
    type: "class",
    value: null,
    className: "Node",
    classVariables: [{ name: "item", targetId: 1 }],
  };

  it("renames, re-points and rejects duplicate names", () => {
    expect(kindOf(applyFieldText(cls, { type: "attrName", index: 0 }, "val")).classVariables[0].name).toBe("val");
    expect(kindOf(applyFieldText(cls, { type: "attrRef", index: 0 }, "4")).classVariables[0].targetId).toBe(4);
    const two = addSlot(cls)!.kind;
    expect("error" in applyFieldText(two, { type: "attrName", index: 1 }, "item")).toBe(true);
  });

  it("validates class and function names", () => {
    expect("error" in applyFieldText(cls, { type: "typeLabel" }, "1abc")).toBe(true);
    expect(kindOf(applyFieldText(cls, { type: "typeLabel" }, "Tree")).className).toBe("Tree");
  });

  it("accepts qualified method names for frames, but not for classes", () => {
    const fn: BoxType = { name: "function", type: "function", value: null, functionName: "f", params: [] };
    expect(kindOf(applyFieldText(fn, { type: "typeLabel" }, "LinkedList.move_to_back")).functionName).toBe("LinkedList.move_to_back");
    expect("error" in applyFieldText(fn, { type: "typeLabel" }, "LinkedList.")).toBe(true);
    expect("error" in applyFieldText(cls, { type: "typeLabel" }, "a.b")).toBe(true);
  });
});

describe("dict edits", () => {
  const dict: BoxType = { name: "dict", type: "dict", value: { 3: 1 } as any };

  it("edits keys and values and adds blank pairs last", () => {
    const k = kindOf(applyFieldText(dict, { type: "dictKey", index: 0 }, "5"));
    expect(k.value).toEqual({ 5: 1 });
    const v = kindOf(applyFieldText(dict, { type: "dictValue", index: 0 }, "2"));
    expect(v.value).toEqual({ 3: 2 });
    const added = addSlot(dict)!;
    expect(Object.keys((added.kind as any).value)).toEqual(["3", " "]);
    expect(added.next).toEqual({ type: "dictKey", index: 1 });
    expect(initialText(added.kind, { type: "dictKey", index: 1 }, 4)).toBe("");
  });

  it("rejects duplicate keys", () => {
    const two: BoxType = { name: "dict", type: "dict", value: { 3: 1, 4: 2 } as any };
    expect("error" in applyRef(two, { type: "dictKey", index: 1 }, 3)).toBe(true);
  });

  it("renders stored entries (regression: dict contents were never drawn)", () => {
    expect(extractDictionary({ value: { 3: 1, " ": "_" } })).toEqual({ 3: 1, _: "_" });
  });
});

describe("Python Tutor inline values", () => {
  it("parses Python literals", () => {
    expect(parsePythonLiteral("5")).toMatchObject({ type: "int", value: "5" });
    expect(parsePythonLiteral("-2.5")).toMatchObject({ type: "float", value: "-2.5" });
    expect(parsePythonLiteral("'hi'")).toMatchObject({ type: "str", value: "hi" });
    expect(parsePythonLiteral('""')).toMatchObject({ type: "str", value: "" });
    expect(parsePythonLiteral("True")).toMatchObject({ type: "bool", value: "true" });
    expect(parsePythonLiteral("None")).toMatchObject({ type: "NoneType" });
    expect(parsePythonLiteral("id3")).toBeNull();
    expect(parsePythonLiteral("hello")).toBeNull();
  });

  it("reads the current target of each slot kind", () => {
    const fn: BoxType = { name: "function", type: "function", value: null, functionName: "f", params: [{ name: "x", targetId: 4 }] };
    expect(getSlotTarget(fn, { type: "attrRef", index: 0 })).toBe(4);
    const list: BoxType = { name: "list", type: "list", value: [7] };
    expect(getSlotTarget(list, { type: "item", index: 0 })).toBe(7);
    const dict: BoxType = { name: "dict", type: "dict", value: { 3: 1, " ": "_" } as any };
    expect(getSlotTarget(dict, { type: "dictKey", index: 0 })).toBe("3");
    expect(getSlotTarget(dict, { type: "dictKey", index: 1 })).toBe("_");
    expect(getSlotTarget(dict, { type: "dictValue", index: 0 })).toBe(1);
  });
});
