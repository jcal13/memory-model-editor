import { useState, useCallback, useRef, useEffect } from "react";
import { CanvasElement } from "../../shared/types";

interface CanvasState {
  elements: CanvasElement[];
  ids: number[];
  classes: string[];
}

interface UndoHistoryReturn {
  canUndo: boolean;
  undo: () => void;
  recordState: (state: CanvasState) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_SIZE = 50;

export function useUndoHistory(
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  setElementIds: React.Dispatch<React.SetStateAction<number[]>>,
  setElementClasses: React.Dispatch<React.SetStateAction<string[]>>
): UndoHistoryReturn {
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoing = useRef(false);

  const recordState = useCallback((state: CanvasState) => {
    // Don't record while we're undoing to prevent recursion
    if (isUndoing.current) return;

    setHistory((prev) => {
      // If we're not at the end of history, discard future states
      const newHistory = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : prev;

      // Deep clone the state to prevent mutations
      const clonedState: CanvasState = {
        elements: JSON.parse(JSON.stringify(state.elements)),
        ids: [...state.ids],
        classes: [...state.classes],
      };

      // Add new state
      const updatedHistory = [...newHistory, clonedState];

      // Limit history size
      if (updatedHistory.length > MAX_HISTORY_SIZE) {
        return updatedHistory.slice(1);
      }

      return updatedHistory;
    });

    setHistoryIndex((prev) => {
      const newIndex = prev + 1;
      return newIndex >= MAX_HISTORY_SIZE ? MAX_HISTORY_SIZE - 1 : newIndex;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex < 0) return;

    isUndoing.current = true;

    const previousState = history[historyIndex];
    if (previousState) {
      // Restore the previous state
      setElements(JSON.parse(JSON.stringify(previousState.elements)));
      setElementIds([...previousState.ids]);
      setElementClasses([...previousState.classes]);

      // Move back in history
      setHistoryIndex((prev) => prev - 1);
    }

    // Use setTimeout to ensure state updates complete before allowing new recordings
    setTimeout(() => {
      isUndoing.current = false;
    }, 0);
  }, [history, historyIndex, setElements, setElementIds, setElementClasses]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const canUndo = historyIndex >= 0;

  return {
    canUndo,
    undo,
    recordState,
    clearHistory,
  };
}
