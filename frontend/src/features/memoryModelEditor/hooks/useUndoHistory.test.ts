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

  it.each([0, 4])("undoes and redoes adding custom ID %s without changing boxes", id => {
    const {result} = renderUndoHistory();
    act(() => result.current.clearHistory({elements: [], ids: [], classes: []}));
    act(() => result.current.recordState({elements: [], ids: [id], classes: []}));
    expect(result.current.canUndo).toBe(true);
    act(() => result.current.undo());
    expect(result.current.ids).toEqual([]);
    act(() => result.current.redo());
    expect(result.current.ids).toEqual([id]);
  });

  it("keeps redo when the canvas auto-adjusts a restored state (regression)", () => {
    // After Undo the canvas may nudge boxes back inside a narrower canvas.
    // That nudge used to be recorded as a new step, wiping the redo stack and
    // leaving Undo bouncing between two states forever.
    const { result } = renderUndoHistory();
    const box = (x: number, value: any[]) =>
      ({ boxId: 1, id: 1, kind: { name: "list", value }, x, y: 0 }) as any;
    const s0 = { elements: [box(600, [])], ids: [1], classes: [] };
    const s1 = { elements: [box(600, [1])], ids: [1], classes: [] };
    const s2 = { elements: [box(600, [1, 2])], ids: [1], classes: [] };
    act(() => result.current.clearHistory(s0));
    act(() => result.current.recordState(s1));
    act(() => result.current.recordState(s2));

    act(() => result.current.undo());
    act(() => result.current.recordState({ ...s1, elements: [box(230, [1])] })); // auto clamp
    act(() => result.current.undo());
    act(() => result.current.recordState({ ...s0, elements: [box(230, [])] })); // auto clamp

    expect(result.current.canUndo).toBe(false); // greyed out at the start
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.redo());
    act(() => result.current.redo());
    expect(result.current.elements[0].kind.value).toEqual([1, 2]);
    expect(result.current.canRedo).toBe(false);
  });

  it("folds the canvas's nudge right after an edit into that edit (regression: undo jitter)", () => {
    jest.useFakeTimers();
    try {
      const { result } = renderUndoHistory();
      const box = (x: number) => ({ boxId: 1, id: 1, kind: { name: "list", value: [] }, x, y: 0 }) as any;
      act(() => result.current.clearHistory({ elements: [], ids: [], classes: [] }));
      act(() => result.current.recordState({ elements: [box(296)], ids: [1], classes: [] })); // drop
      act(() => result.current.recordState({ elements: [box(319)], ids: [1], classes: [] })); // auto clamp
      act(() => result.current.undo());
      expect(result.current.elements).toEqual([]); // one Undo removes the box

      // A deliberate move later is still its own step.
      act(() => result.current.redo());
      jest.setSystemTime(Date.now() + 2000);
      act(() => result.current.recordState({ elements: [box(400)], ids: [1], classes: [] }));
      act(() => result.current.undo());
      expect(result.current.elements[0].x).toBe(319);
    } finally {
      jest.useRealTimers();
    }
  });

  it("still discards redo for a real edit after an undo", () => {
    jest.useFakeTimers();
    try {
      const { result } = renderUndoHistory();
      const st = (v: any[]) => ({ elements: [{ boxId: 1, id: 1, kind: { name: "list", value: v }, x: 0, y: 0 }], ids: [1], classes: [] }) as any;
      act(() => result.current.clearHistory(st([])));
      act(() => result.current.recordState(st([1])));
      act(() => result.current.undo());
      act(() => { jest.advanceTimersByTime(1000); });
      jest.setSystemTime(Date.now() + 1000);
      act(() => result.current.recordState(st([9])));
      expect(result.current.canRedo).toBe(false);
      expect(result.current.canUndo).toBe(true);
    } finally {
      jest.useRealTimers();
    }
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