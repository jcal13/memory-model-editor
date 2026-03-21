// Storage utility functions - pure functions for localStorage operations

import { CanvasElement, SubmissionResult, Tab } from "../../shared/types";

// Storage keys
const CANVAS_STORAGE_KEY = "canvas_key";
const UI_STORAGE_KEY = "canvas_ui_state_v3";

const QUESTION_CANVAS_PREFIX = "question_canvas_";
const DO_NOT_REMIND_KEY = "do_not_remind_canvas_clear";

// Default values
const DEFAULT_CANVAS_DATA = {
  elements: [] as CanvasElement[],
  ids: [] as number[],
  classes: [] as string[],
};

const DEFAULT_UI_STATE = {
  activeTab: "question" as Tab,
  questionIndex: null as number | null,
  questionType: null as "test" | "practice" | "prep" | "experiment" | null,
  submissionResults: null as SubmissionResult | null,
  sandboxMode: null as boolean | null,
};

export interface CanvasData {
  elements: CanvasElement[];
  ids: number[];
  classes: string[];
}

export function normalizeCanvasData(raw: unknown): CanvasData {
  if (!raw || typeof raw !== "object") return DEFAULT_CANVAS_DATA;

  const parsed = raw as {
    elements?: unknown;
    ids?: unknown;
    classes?: unknown;
  };

  return {
    elements: Array.isArray(parsed.elements) ? parsed.elements : [],
    ids: Array.isArray(parsed.ids) ? parsed.ids : [],
    classes: Array.isArray(parsed.classes) ? parsed.classes : [],
  };
}

export type QuestionView =
  | "root"
  | "loading"
  | "test"
  | "list"
  | "question"
  | "practice"
  | "prep"
  | "experiment";

export interface UIState {
  activeTab: Tab;
  questionIndex: number | null;
  questionType: "test" | "practice" | "prep" | "experiment" | null;
  submissionResults: SubmissionResult | null;
  sandboxMode: boolean | null;
  questionView?: QuestionView;
  isInfoPanelOpen?: boolean;
  canvasScale?: number;
  editorScale?: number;
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
    return normalizeCanvasData(parsed);
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

    // Validate and normalize each field - removed "errors" validation
    const activeTab: Tab =
      parsed?.activeTab === "feedback" || parsed?.activeTab === "question"
        ? parsed.activeTab
        : "question";

    const questionIndex =
      typeof parsed?.questionIndex === "number" ? parsed.questionIndex : null;

    const questionType =
      parsed?.questionType === "test" || parsed?.questionType === "practice" || parsed?.questionType === "prep" || parsed?.questionType === "experiment"
        ? parsed.questionType
        : null;

    const submissionResults = validateSubmissionResults(
      parsed?.submissionResults
    );

    const sandboxMode =
      typeof parsed?.sandboxMode === "boolean" ? parsed.sandboxMode : null;

    const validViews = [
      "root",
      "loading",
      "test",
      "list",
      "question",
      "practice",
      "prep",
      "experiment",
    ];
    const questionView =
      typeof parsed?.questionView === "string" && validViews.includes(parsed.questionView) && parsed.questionView !== "loading"
        ? parsed.questionView
        : undefined;

    const isInfoPanelOpen =
      typeof parsed?.isInfoPanelOpen === "boolean" ? parsed.isInfoPanelOpen : undefined;

    const canvasScale =
      typeof parsed?.canvasScale === "number" &&
      parsed.canvasScale >= 0.5 &&
      parsed.canvasScale <= 2.0
        ? parsed.canvasScale
        : undefined;

    const editorScale =
      typeof parsed?.editorScale === "number" &&
      parsed.editorScale >= 0.5 &&
      parsed.editorScale <= 2.0
        ? parsed.editorScale
        : undefined;

    return {
      activeTab,
      questionIndex,
      questionType,
      submissionResults,
      sandboxMode,
      questionView,
      isInfoPanelOpen,
      canvasScale,
      editorScale,
    };
  } catch (error) {
    console.warn("Failed to load UI data from localStorage:", error);
    return DEFAULT_UI_STATE;
  }
}

/**
 * Validates submission results from localStorage
 */
function validateSubmissionResults(rawResults: any): SubmissionResult | null {
  if (!rawResults || typeof rawResults !== "object") return null;
  if (typeof rawResults.correct !== "boolean") return null;

  return {
    correct: rawResults.correct,
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

/**
 * Gets the storage key for a specific question's canvas
 */
function getQuestionCanvasKey(
  type: "test" | "practice" | "prep" | "experiment",
  index: number
): string {
  return `${QUESTION_CANVAS_PREFIX}${type}_${index}`;
}

/**
 * Saves canvas data for a specific question
 */
export function saveQuestionCanvasData(
  type: "test" | "practice" | "prep" | "experiment",
  index: number,
  data: CanvasData
): void {
  try {
    const key = getQuestionCanvasKey(type, index);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save question canvas data:", error);
  }
}

/**
 * Loads canvas data for a specific question
 */
export function loadQuestionCanvasData(
  type: "test" | "practice" | "prep" | "experiment",
  index: number
): CanvasData | null {
  try {
    const key = getQuestionCanvasKey(type, index);
    const rawData = localStorage.getItem(key);
    if (!rawData) return null;

    const parsed = JSON.parse(rawData);
    return normalizeCanvasData(parsed);
  } catch (error) {
    console.warn("Failed to load question canvas data:", error);
    return null;
  }
}

/**
 * Resolves a question canvas state from localStorage with an optional fallback.
 * LocalStorage takes precedence; fallback is used only if no saved state exists.
 */
export function resolveQuestionCanvasData(
  type: "test" | "practice" | "prep" | "experiment",
  index: number,
  fallback?: CanvasData | null
): CanvasData {
  const saved = loadQuestionCanvasData(type, index);
  if (saved) return saved;

  return normalizeCanvasData(fallback);
}

/**
 * Checks if user has opted out of canvas clear reminders
 */
export function getDoNotRemindCanvasClear(): boolean {
  try {
    const value = localStorage.getItem(DO_NOT_REMIND_KEY);
    return value === "true";
  } catch (error) {
    return false;
  }
}

/**
 * Sets the do not remind preference for canvas clearing
 */
export function setDoNotRemindCanvasClear(value: boolean): void {
  try {
    localStorage.setItem(DO_NOT_REMIND_KEY, value.toString());
  } catch (error) {
    console.warn("Failed to save do not remind preference:", error);
  }
}

/**
 * Deletes canvas data for a specific question
 */
export function deleteQuestionCanvasData(
  type: "test" | "practice" | "prep" | "experiment",
  index: number
): void {
  try {
    const key = getQuestionCanvasKey(type, index);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Failed to delete question canvas data:", error);
  }
}

// Backwards compatibility aliases removed - all code now uses the modern function names
// Previously exported: getQuestionStorageKey, saveQuestionCanvas, loadQuestionCanvas, saveUIData
