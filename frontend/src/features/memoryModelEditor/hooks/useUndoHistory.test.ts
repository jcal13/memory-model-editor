import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import { useUndoHistory } from "./useUndoHistory";

describe("useUndoHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderUndoHistory = () =>
    renderHook(() => {
      const [elements, setElements] = useState<any[]>([]);
      const [ids, setIds] = useState<number[]>([]);
      const [classes, setClasses] = useState<string[]>([]);

      const undoHistory = useUndoHistory(setElements, setIds, setClasses);

      return { elements, ids, classes, ...undoHistory };
    });

  it("undoes newly added boxes one by one", () => {
    const { result } = renderUndoHistory();

    act(() => {
      result.current.clearHistory({ elements: [], ids: [], classes: [] });
    });

    act(() => {
      result.current.recordState({
        elements: [{ boxId: 1, id: "id1", kind: { name: "int" }, x: 0, y: 0 }],
        ids: [1],
        classes: [],
      } as any);
    });

    act(() => {
      result.current.recordState({
        elements: [
          { boxId: 1, id: "id1", kind: { name: "int", value: 0 }, x: 0, y: 0 },
          { boxId: 2, id: "id2", kind: { name: "int", value: 0 }, x: 100, y: 0 },
        ],
        ids: [1, 2],
        classes: [],
      } as any);
    });

    act(() => {
      result.current.recordState({
        elements: [
          { boxId: 1, id: "id1", kind: { name: "int", value: 0 }, x: 0, y: 0 },
          { boxId: 2, id: "id2", kind: { name: "int", value: 0 }, x: 10, y: 0 },
          { boxId: 3, id: "id3", kind: { name: "int", value: 0 }, x: 20, y: 0 },
        ],
        ids: [1, 2, 3],
        classes: [],
      } as any);
    });

    act(() => result.current.undo());
    expect(result.current.elements.map((el) => el.boxId)).toEqual([1, 2]);

    act(() => result.current.undo());
    expect(result.current.elements.map((el) => el.boxId)).toEqual([1]);

    act(() => result.current.undo());
    expect(result.current.elements).toEqual([]);
  });

  it("undoes value edits before undoing added boxes", () => {
    const { result } = renderUndoHistory();

    act(() => {
      result.current.clearHistory({ elements: [], ids: [], classes: [] });
    });

    act(() => {
      result.current.recordState({
        elements: [
          { boxId: 1, id: "id1", kind: { name: "int", value: 0 }, x: 0, y: 0 },
        ],
        ids: [1],
        classes: [],
      } as any);
    });

    act(() => {
      result.current.recordState({
        elements: [
          { boxId: 1, id: "id1", kind: { name: "int", value: 0 }, x: 0, y: 0 },
          { boxId: 2, id: "id2", kind: { name: "int", value: 0 }, x: 10, y: 0 },
        ],
        ids: [1, 2],
        classes: [],
      } as any);
    });

    act(() => {
      result.current.recordState({
        elements: [
          { boxId: 1, id: "id1", kind: { name: "int", value: 1 }, x: 0, y: 0 },
          { boxId: 2, id: "id2", kind: { name: "int", value: 0 }, x: 10, y: 0 },
        ],
        ids: [1, 2],
        classes: [],
      } as any);
    });

    act(() => result.current.undo());
    expect(result.current.elements[0].kind.value).toBe(0);
    expect(result.current.elements.map((el) => el.boxId)).toEqual([1, 2]);

    act(() => result.current.undo());
    expect(result.current.elements.map((el) => el.boxId)).toEqual([1]);

    act(() => result.current.undo());
    expect(result.current.elements).toEqual([]);
  });
});