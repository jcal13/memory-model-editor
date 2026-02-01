import { useEffect } from "react";
import {
  CanvasData,
  UIState,
  saveCanvasData,
  saveUIState,
} from "../utils/localStorage";

/**
 * Hook that automatically saves UI state to localStorage when it changes
 * @param state - UI state to persist
 */
export function useUILocalStorage(state: UIState): void {
  useEffect(() => {
    saveUIState(state);
  }, [
    state.activeTab,
    state.questionIndex,
    state.questionType,
    state.submissionResults,
    state.sandboxMode,
    state.questionView,
    state.isInfoPanelOpen,
  ]);
}

/**
 * Hook that automatically saves canvas data to localStorage when it changes
 * @param data - Canvas data to persist
 */
export function useCanvasLocalStorage(data: CanvasData): void {
  useEffect(() => {
    saveCanvasData(data);
  }, [data.elements, data.ids, data.classes]);
}
