// Storage utility functions - pure functions for localStorage operations

import { CanvasElement, SubmissionResult, Tab } from "../../shared/types";

// Storage keys
const CANVAS_STORAGE_KEY = "canvas_key";
const UI_STORAGE_KEY = "canvas_ui_state_v3";

// Default values
const DEFAULT_CANVAS_DATA = {
  elements: [] as CanvasElement[],
  ids: [] as number[],
  classes: [] as string[],
};

const DEFAULT_UI_STATE = {
  activeTab: "question" as Tab,
  questionIndex: null as number | null,
  questionType: null as "test" | "practice" | null,
  submissionResults: null as SubmissionResult,
  sandboxMode: null as boolean | null,
};

export interface CanvasData {
  elements: CanvasElement[];
  ids: number[];
  classes: string[];
}

export interface UIState {
  activeTab: Tab;
  questionIndex: number | null;
  questionType: "test" | "practice" | null;
  submissionResults: SubmissionResult;
  sandboxMode: boolean | null;
}

/**
 * Loads initial canvas data from localStorage
 * @returns Canvas data with elements, ids, and classes
 */
export function loadInitialCanvasData(): CanvasData {
  try {
    const rawData = localStorage.getItem(CANVAS_STORAGE_KEY);
    if (!rawData) return DEFAULT_CANVAS_DATA;

    const parsed = JSON.parse(rawData);

    return {
      elements: Array.isArray(parsed?.elements) ? parsed.elements : [],
      ids: Array.isArray(parsed?.ids) ? parsed.ids : [],
      classes: Array.isArray(parsed?.classes) ? parsed.classes : [],
    };
  } catch (error) {
    console.warn("Failed to load canvas data from localStorage:", error);
    return DEFAULT_CANVAS_DATA;
  }
}

/**
 * Loads initial UI state from localStorage
 * @returns UI state with tab, question info, and results
 */
export function loadInitialUIData(): UIState {
  try {
    const rawData = localStorage.getItem(UI_STORAGE_KEY);
    if (!rawData) return DEFAULT_UI_STATE;

    const parsed = JSON.parse(rawData);

    // Validate and normalize each field
    const activeTab: Tab =
      parsed?.activeTab === "feedback" ? "feedback" : "question";

    const questionIndex =
      typeof parsed?.questionIndex === "number" ? parsed.questionIndex : null;

    const questionType =
      parsed?.questionType === "test" || parsed?.questionType === "practice"
        ? parsed.questionType
        : null;

    const submissionResults = validateSubmissionResults(
      parsed?.submissionResults
    );

    const sandboxMode =
      typeof parsed?.sandboxMode === "boolean" ? parsed.sandboxMode : null;

    return {
      activeTab,
      questionIndex,
      questionType,
      submissionResults,
      sandboxMode,
    };
  } catch (error) {
    console.warn("Failed to load UI data from localStorage:", error);
    return DEFAULT_UI_STATE;
  }
}

/**
 * Validates and normalizes submission results from storage
 * @param rawResults - Raw results from localStorage
 * @returns Validated SubmissionResult or null
 */
function validateSubmissionResults(rawResults: any): SubmissionResult {
  if (!rawResults || typeof rawResults !== "object") {
    return null;
  }

  return {
    correct: Boolean(rawResults.correct),
    errors: Array.isArray(rawResults.errors)
      ? rawResults.errors
      : Array.isArray(rawResults.messages)
      ? rawResults.messages
      : [],
  };
}

/**
 * Saves canvas data to localStorage
 * @param data - Canvas data to save
 */
export function saveCanvasData(data: CanvasData): void {
  try {
    localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save canvas data to localStorage:", error);
  }
}

/**
 * Saves UI state to localStorage
 * @param state - UI state to save
 */
export function saveUIState(state: UIState): void {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save UI state to localStorage:", error);
  }
}

/**
 * Clears canvas data from localStorage
 */
export function clearCanvasStorage(): void {
  try {
    localStorage.removeItem(CANVAS_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear canvas storage:", error);
  }
}
