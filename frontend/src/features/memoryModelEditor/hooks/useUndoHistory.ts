import { useState, useCallback, useRef, useEffect } from "react";
import { CanvasElement } from "../../shared/types";

interface CanvasState {
  elements: CanvasElement[];
  ids: number[];
  classes: string[];
}

interface UndoHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  recordState: (state: CanvasState) => void;
  clearHistory: (baselineState?: CanvasState) => void;
}

const MAX_HISTORY_SIZE = 50;
const HISTORY_STORAGE_KEY = "canvas_undo_history";
const HISTORY_INDEX_STORAGE_KEY = "canvas_undo_history_index";

const normalizeElements = (elements: CanvasElement[]) =>
  elements.map(({ color, invalidated, ...rest }) => rest);

export function useUndoHistory(
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  setElementIds: React.Dispatch<React.SetStateAction<number[]>>,
  setElementClasses: React.Dispatch<React.SetStateAction<string[]>>
): UndoHistoryReturn {
  // Load initial history from localStorage
  const loadHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      const savedIndex = localStorage.getItem(HISTORY_INDEX_STORAGE_KEY);
      return {
        history: saved ? JSON.parse(saved) : [],
        index: savedIndex ? parseInt(savedIndex, 10) : -1,
      };
    } catch (error) {
      console.error("Failed to load undo history:", error);
      return { history: [], index: -1 };
    }
  }, []);

  const { history: initialHistory, index: initialIndex } = loadHistory();

  const [history, setHistory] = useState<CanvasState[]>(initialHistory);
  const [historyIndex, setHistoryIndex] = useState(initialIndex);
  const isUndoRedoing = useRef(false);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      localStorage.setItem(HISTORY_INDEX_STORAGE_KEY, historyIndex.toString());
    } catch (error) {
      console.error("Failed to save undo history:", error);
    }
  }, [history, historyIndex]);

  const recordState = useCallback((state: CanvasState) => {
    // Don't record while we're undoing/redoing to prevent recursion
    if (isUndoRedoing.current) return;
    
    setHistory((prev) => {
      // If we're in the middle of history (after undo), discard future states
      const currentHistory = prev.slice(0, historyIndex + 1);
    
      // Deep clone the state to prevent mutations
      const clonedState: CanvasState = {
        elements: JSON.parse(JSON.stringify(state.elements)),
        ids: [...state.ids],
        classes: [...state.classes],
      };
    
      // Add new state
      const lastState = currentHistory[currentHistory.length - 1];
    
      const isDuplicate =
        lastState &&
        JSON.stringify(normalizeElements(lastState.elements)) ===
          JSON.stringify(normalizeElements(clonedState.elements));
    
      if (isDuplicate) {
        return prev;
      }
    
      const updatedHistory = [...currentHistory, clonedState];
    
      // Limit history size
      if (updatedHistory.length > MAX_HISTORY_SIZE) {
        const trimmed = updatedHistory.slice(1);
        // Adjust index since we removed from the beginning
        setHistoryIndex(trimmed.length - 1);
        return trimmed;
      }
    
      setHistoryIndex(updatedHistory.length - 1);
      return updatedHistory;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    // Need at least 2 states in history to undo (index 1 to go back to index 0)
    if (historyIndex < 1) return;
    
    isUndoRedoing.current = true;

    const previousIndex = historyIndex - 1;
    const previousState = history[previousIndex];

    if (previousState) {
      // Restore the previous state
      setElements(JSON.parse(JSON.stringify(previousState.elements)));
      setElementIds([...previousState.ids]);
      setElementClasses([...previousState.classes]);

      // Move back in history
      setHistoryIndex(previousIndex);
    }

    // Use setTimeout to ensure state updates complete before allowing new recordings
    setTimeout(() => {
      isUndoRedoing.current = false;
    }, 0);
  }, [history, historyIndex, setElements, setElementIds, setElementClasses]);

  const redo = useCallback(() => {
    // Can redo if we're not at the end of history
    if (historyIndex >= history.length - 1) return;

    isUndoRedoing.current = true;

    const nextIndex = historyIndex + 1;
    const nextState = history[nextIndex];

    if (nextState) {
      // Restore the next state
      setElements(JSON.parse(JSON.stringify(nextState.elements)));
      setElementIds([...nextState.ids]);
      setElementClasses([...nextState.classes]);

      // Move forward in history
      setHistoryIndex(nextIndex);
    }

    // Use setTimeout to ensure state updates complete before allowing new recordings
    setTimeout(() => {
      isUndoRedoing.current = false;
    }, 0);
  }, [history, historyIndex, setElements, setElementIds, setElementClasses]);

  const clearHistory = useCallback((baselineState?: CanvasState) => {
    const initialState: CanvasState = baselineState ?? {
      elements: [],
      ids: [],
      classes: [],
    };
  
    setHistory([initialState]);
    setHistoryIndex(0);
  
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([initialState]));
      localStorage.setItem(HISTORY_INDEX_STORAGE_KEY, "0");
    } catch (error) {
      console.error("Failed to clear undo history from localStorage:", error);
    }
  }, []);

  const canUndo = historyIndex >= 1;
  const canRedo = historyIndex < history.length - 1;

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    recordState,
    clearHistory,
  };
}
