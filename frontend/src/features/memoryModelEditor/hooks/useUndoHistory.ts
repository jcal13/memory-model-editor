import { workspaceStorage } from "../../tutorial/tutorialStorage";
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
/**
 * After Undo/Redo the canvas may adjust the restored state on its own (e.g.
 * clamping boxes into a narrower canvas, ResizeObserver-debounced). Changes in
 * this window are folded into the restored entry instead of becoming a new
 * step, which would otherwise discard the redo stack.
 */
const RESTORE_SETTLE_MS = 500;
/**
 * The canvas also nudges a box right after an edit (e.g. clamping a dropped
 * box away from the call stack). A position-only change this soon after a
 * recorded step belongs to that step; recording it separately made Undo
 * appear to do nothing and then jitter as the canvas re-applied the nudge.
 */
const AUTO_ADJUST_MS = 300;
const HISTORY_STORAGE_KEY = "canvas_undo_history";
const HISTORY_INDEX_STORAGE_KEY = "canvas_undo_history_index";

const normalizeElements = (elements: CanvasElement[]) =>
  // Validation/feedback annotations are derived state, not user edits.
  elements.map(({ color, invalidated, errors, ...rest }) => rest);

const withoutPositions = (state: CanvasState) =>
  JSON.stringify({
    elements: normalizeElements(state.elements).map(({ x, y, ...rest }) => rest),
    ids: state.ids,
    classes: state.classes,
  });

const sameIgnoringPositions = (a: CanvasState, b: CanvasState) =>
  withoutPositions(a) === withoutPositions(b);

export function useUndoHistory(
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  setElementIds: React.Dispatch<React.SetStateAction<number[]>>,
  setElementClasses: React.Dispatch<React.SetStateAction<string[]>>
): UndoHistoryReturn {
  // Load initial history from localStorage
  const loadHistory = useCallback(() => {
    try {
      const saved = workspaceStorage.getItem(HISTORY_STORAGE_KEY);
      const savedIndex = workspaceStorage.getItem(HISTORY_INDEX_STORAGE_KEY);
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
  const settleUntil = useRef(0);
  const lastRecordAt = useRef(0);
  // Live index for recordState (its closure can be a render behind).
  const indexRef = useRef(historyIndex);
  indexRef.current = historyIndex;
  const historyRef = useRef(history);
  historyRef.current = history;

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      workspaceStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      workspaceStorage.setItem(HISTORY_INDEX_STORAGE_KEY, historyIndex.toString());
    } catch (error) {
      console.error("Failed to save undo history:", error);
    }
  }, [history, historyIndex]);

  const recordState = useCallback((state: CanvasState) => {
    const index = indexRef.current;

    // Deep clone the state to prevent mutations
    const clonedState: CanvasState = {
      elements: JSON.parse(JSON.stringify(state.elements)),
      ids: [...state.ids],
      classes: [...state.classes],
    };

    if (Date.now() < settleUntil.current) {
      const restored = historyRef.current[index];
      if (restored && sameIgnoringPositions(restored, clonedState)) {
        // The canvas re-positioned boxes of a just-restored state (e.g. to
        // fit a narrower canvas): update that entry in place.
        setHistory((prev) =>
          prev[index] ? prev.map((entry, i) => (i === index ? clonedState : entry)) : prev
        );
        return;
      }
      settleUntil.current = 0; // anything else is a real edit
    }

    if (Date.now() - lastRecordAt.current < AUTO_ADJUST_MS) {
      const latest = historyRef.current[index];
      if (
        latest &&
        index === historyRef.current.length - 1 &&
        sameIgnoringPositions(latest, clonedState)
      ) {
        setHistory((prev) =>
          prev[index] ? prev.map((entry, i) => (i === index ? clonedState : entry)) : prev
        );
        return;
      }
    }

    setHistory((prev) => {
      // If we're in the middle of history (after undo), discard future states
      const currentHistory = prev.slice(0, index + 1);

      // Add new state
      const lastState = currentHistory[currentHistory.length - 1];
    
      const isDuplicate =
        lastState &&
        JSON.stringify(normalizeElements(lastState.elements)) ===
          JSON.stringify(normalizeElements(clonedState.elements)) &&
        JSON.stringify(lastState.ids) === JSON.stringify(clonedState.ids) &&
        JSON.stringify(lastState.classes) === JSON.stringify(clonedState.classes);
    
      if (isDuplicate) {
        return prev;
      }
    
      const updatedHistory = [...currentHistory, clonedState];
      lastRecordAt.current = Date.now();
    
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
  }, []);

  const undo = useCallback(() => {
    // Need at least 2 states in history to undo (index 1 to go back to index 0)
    if (historyIndex < 1) return;
    
    settleUntil.current = Date.now() + RESTORE_SETTLE_MS;

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

  }, [history, historyIndex, setElements, setElementIds, setElementClasses]);

  const redo = useCallback(() => {
    // Can redo if we're not at the end of history
    if (historyIndex >= history.length - 1) return;

    settleUntil.current = Date.now() + RESTORE_SETTLE_MS;

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
      workspaceStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([initialState]));
      workspaceStorage.setItem(HISTORY_INDEX_STORAGE_KEY, "0");
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
