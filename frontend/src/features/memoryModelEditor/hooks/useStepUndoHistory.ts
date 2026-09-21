import { useCallback, useState } from "react";
import { CanvasElement } from "../../shared/types";

export interface StepAssignments {
  variableToId: Record<string, number>;
  idToType: Record<number, string>;
}

export interface StepHistoryState {
  elements: CanvasElement[];
  ids: number[];
  classes: string[];
  stepByStepIndex: number;
  committedAssignments: StepAssignments | null;
}

interface StepUndoHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  recordState: (state: StepHistoryState) => void;
  clearHistory: (baselineState: StepHistoryState) => void;
}

const MAX_HISTORY_SIZE = 50;

const cloneState = (state: StepHistoryState): StepHistoryState => ({
  elements: JSON.parse(JSON.stringify(state.elements)),
  ids: [...state.ids],
  classes: [...state.classes],
  stepByStepIndex: state.stepByStepIndex,
  committedAssignments: state.committedAssignments
    ? {
        variableToId: { ...state.committedAssignments.variableToId },
        idToType: { ...state.committedAssignments.idToType },
      }
    : null,
});

const statesEqual = (
  left: StepHistoryState,
  right: StepHistoryState,
): boolean => JSON.stringify(left) === JSON.stringify(right);

export function useStepUndoHistory(
  restoreState: (state: StepHistoryState) => void,
): StepUndoHistoryReturn {
  const [history, setHistory] = useState<StepHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const recordState = useCallback(
    (state: StepHistoryState) => {
      setHistory((previousHistory) => {
        const currentHistory = previousHistory.slice(0, historyIndex + 1);
        const clonedState = cloneState(state);
        const lastState = currentHistory[currentHistory.length - 1];

        if (lastState && statesEqual(lastState, clonedState)) {
          return previousHistory;
        }

        const updatedHistory = [...currentHistory, clonedState];
        if (updatedHistory.length > MAX_HISTORY_SIZE) {
          const trimmedHistory = updatedHistory.slice(1);
          setHistoryIndex(trimmedHistory.length - 1);
          return trimmedHistory;
        }

        setHistoryIndex(updatedHistory.length - 1);
        return updatedHistory;
      });
    },
    [historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex < 1) return;
    const previousState = history[historyIndex - 1];
    if (!previousState) return;

    setHistoryIndex(historyIndex - 1);
    restoreState(cloneState(previousState));
  }, [history, historyIndex, restoreState]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextState = history[historyIndex + 1];
    if (!nextState) return;

    setHistoryIndex(historyIndex + 1);
    restoreState(cloneState(nextState));
  }, [history, historyIndex, restoreState]);

  const clearHistory = useCallback((baselineState: StepHistoryState) => {
    setHistory([cloneState(baselineState)]);
    setHistoryIndex(0);
  }, []);

  return {
    canUndo: historyIndex >= 1,
    canRedo: historyIndex >= 0 && historyIndex < history.length - 1,
    undo,
    redo,
    recordState,
    clearHistory,
  };
}
