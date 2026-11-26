import { boxReadingOrder, describeBox } from "./boxDescriptions";
import { CanvasElement } from "../../shared/types";

const at = (el: Omit<CanvasElement, "x" | "y">): CanvasElement => ({ x: 0, y: 0, ...el } as CanvasElement);

describe("describeBox", () => {
  it("describes frames with their variables", () => {
    expect(
      describeBox(at({ boxId: 0, id: "_", kind: { name: "function", type: "function", value: null, functionName: "__main__", params: [{ name: "a", targetId: 1 }, { name: "b", targetId: null }] } }))
    ).toBe("Frame __main__: a → id1, b → empty");
  });

  it("describes primitives, quoting strings", () => {
    expect(describeBox(at({ boxId: 1, id: 3, kind: { name: "primitive", type: "int", value: "5" } }))).toBe("int object id3, value 5");
    expect(describeBox(at({ boxId: 2, id: "_", kind: { name: "primitive", type: "str", value: "hi" } }))).toBe('str object no id, value "hi"');
    expect(describeBox(at({ boxId: 3, id: 4, kind: { name: "primitive", type: "NoneType", value: "None" } }))).toBe("None object id4");
  });

  it("describes collections and crossed-out boxes", () => {
    expect(describeBox(at({ boxId: 4, id: 2, kind: { name: "list", type: "list", value: [1, 3] } }))).toBe("list id2, 2 items: id1, id3");
    expect(describeBox(at({ boxId: 5, id: 6, invalidated: true, kind: { name: "tuple", type: "tuple", value: [] } }))).toBe("tuple id6, empty (crossed out)");
  });
});

describe("boxReadingOrder", () => {
  it("puts frames first, then objects row by row", () => {
    expect(
      boxReadingOrder([
        { boxId: 1, isFrame: false, left: 300, top: 100 },
        { boxId: 2, isFrame: false, left: 100, top: 110 },
        { boxId: 3, isFrame: false, left: 100, top: 300 },
        { boxId: 0, isFrame: true, left: 0, top: 400 },
        { boxId: 4, isFrame: true, left: 0, top: 200 },
      ])
    ).toEqual([4, 0, 2, 1, 3]);
  });
});
