import { buildJSONFromElements } from "./jsonBuilder";
import { CanvasElement } from "../types";

describe("buildJSONFromElements", () => {
  it("handles a primitive int", () => {
    const elements: CanvasElement[] = [
      {
        id: 1,
        x: 0,
        y: 0,
        kind: {
          name: "primitive",
          type: "int",
          value: "42",
        },
      },
    ];

    const result = buildJSONFromElements(elements);

    expect(result).toEqual([
      { type: "int", id: 1, value: 42 },
    ]);
  });

  it("handles a function with one param", () => {
    const elements: CanvasElement[] = [
      {
        id: 2,
        x: 0,
        y: 0,
        kind: {
          name: "function",
          type: "function",
          value: null,
          functionName: "main",
          params: [
            { name: "x", targetId: 7 },
            { name: "y", targetId: null },
          ],
        },
      },
    ];

    const result = buildJSONFromElements(elements);

    expect(result).toEqual([
      {
        type: ".frame",
        name: "main",
        id: null,
        value: { x: 7 },
      },
    ]);
  });

  it("handles a dict", () => {
    const elements: CanvasElement[] = [
      {
        id: 3,
        x: 0,
        y: 0,
        kind: {
          name: "dict",
          type: "dict",
          value: {
            a: 9,
            b: null,
          },
        },
      },
    ];

    const result = buildJSONFromElements(elements);

    expect(result).toEqual([
      {
        type: "dict",
        id: 3,
        value: {
          a: 9,
          b: null,
        },
      },
    ]);
  });

  it("handles list, tuple, and set", () => {
    const elements: CanvasElement[] = [
      {
        id: 4,
        x: 0,
        y: 0,
        kind: {
          name: "list",
          type: "list",
          value: [1, 2],
        },
      },
      {
        id: 5,
        x: 0,
        y: 0,
        kind: {
          name: "tuple",
          type: "tuple",
          value: [3, 4],
        },
      },
      {
        id: 6,
        x: 0,
        y: 0,
        kind: {
          name: "set",
          type: "set",
          value: [5],
        },
      },
    ];

    const result = buildJSONFromElements(elements);

    expect(result).toEqual([
      { type: "list", id: 4, value: [1, 2] },
      { type: "tuple", id: 5, value: [3, 4] },
      { type: "set", id: 6, value: [5] },
    ]);
  });
});
