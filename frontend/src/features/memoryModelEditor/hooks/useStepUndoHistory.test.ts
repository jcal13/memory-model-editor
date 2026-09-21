import { act, renderHook } from "@testing-library/react";
import { StepHistoryState, useStepUndoHistory } from "./useStepUndoHistory";

const state = (stepByStepIndex: number): StepHistoryState => ({
  elements: [],
  ids: [],
  classes: [],
  stepByStepIndex,
  committedAssignments: null,
});

describe("useStepUndoHistory", () => {
  it("restores the previous and next successful checkpoints", () => {
    const restoreState = jest.fn();
    const { result } = renderHook(() => useStepUndoHistory(restoreState));

    act(() => result.current.clearHistory(state(0)));
    act(() => result.current.recordState(state(1)));

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    act(() => result.current.undo());
    expect(restoreState).toHaveBeenLastCalledWith(state(0));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(restoreState).toHaveBeenLastCalledWith(state(1));
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("discards the redo branch after a new checkpoint", () => {
    const restoreState = jest.fn();
    const { result } = renderHook(() => useStepUndoHistory(restoreState));

    act(() => result.current.clearHistory(state(0)));
    act(() => result.current.recordState(state(1)));
    act(() => result.current.recordState(state(2)));

    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.recordState(state(3)));
    expect(result.current.canRedo).toBe(false);
    expect(result.current.canUndo).toBe(true);
  });
});
