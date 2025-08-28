import { useEffect } from "react";
import { CanvasElement, SubmissionResult, Tab } from "../../shared/types";
import { submitCanvas } from "../../validationServices/questionValidationService";

const LS_KEY = "canvas_key";
const UI_LS_KEY = "canvas_ui_state_v3";

// Layout constants
const MIN_INFO_PANEL_WIDTH = 100;
const MAX_INFO_PANEL_VIEWPORT_RATIO = 0.6667;
const INFO_PANEL_OFFSET = 100;

export const loadInitialCanvasData = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { elements: [], ids: [], classes: [] };
    const parsed = JSON.parse(raw);
    return {
      elements: Array.isArray(parsed?.elements) ? parsed.elements : [],
      ids: Array.isArray(parsed?.ids) ? parsed.ids : [],
      classes: Array.isArray(parsed?.classes) ? parsed.classes : [],
    };
  } catch {
    return { elements: [], ids: [], classes: [] };
  }
};

export function clearCanvasStorage() {
  localStorage.removeItem(LS_KEY);
}

export function loadInitialUIData(): UIState {
  try {
    const raw = localStorage.getItem(UI_LS_KEY);
    if (!raw) {
      return {
        activeTab: "question",
        questionIndex: null,
        questionType: null,
        submissionResults: null,
        sandboxMode: null,
      };
    }
    const parsed = JSON.parse(raw);

    const activeTab: Tab =
      parsed?.activeTab === "feedback" ? "feedback" : "question";

    const questionIndex =
      typeof parsed?.questionIndex === "number" ? parsed.questionIndex : null;

    const questionType =
      parsed?.questionType === "test" || parsed?.questionType === "practice"
        ? parsed.questionType
        : null;

    const sr = parsed?.submissionResults;
    const submissionResults: SubmissionResult =
      sr && typeof sr === "object"
        ? {
            correct: !!sr.correct,
            errors: Array.isArray(sr.errors)
              ? sr.errors
              : Array.isArray(sr.messages)
              ? sr.messages
              : [],
          }
        : null;

    const sandboxMode: boolean | null =
      typeof parsed?.sandboxMode === "boolean" ? parsed.sandboxMode : null;

    return {
      activeTab,
      questionIndex,
      questionType,
      submissionResults,
      sandboxMode,
    };
  } catch {
    return {
      activeTab: "question",
      questionIndex: null,
      questionType: null,
      submissionResults: null,
      sandboxMode: null,
    };
  }
}

export type UIState = {
  activeTab: Tab;
  questionIndex: number | null;
  questionType: "test" | "practice" | null;
  submissionResults: SubmissionResult;
  sandboxMode: boolean | null;
};

/** Persist UI state (tab, question, mode, feedback, sandbox) under the NEW key */
export function useUILocalStorage(state: UIState) {
  const {
    activeTab,
    questionIndex,
    questionType,
    submissionResults,
    sandboxMode,
  } = state;

  useEffect(() => {
    try {
      localStorage.setItem(
        UI_LS_KEY,
        JSON.stringify({
          activeTab,
          questionIndex,
          questionType,
          submissionResults,
          sandboxMode,
        })
      );
    } catch {}
  }, [activeTab, questionIndex, questionType, submissionResults, sandboxMode]);
}

export function useCanvasLocalStorage({
  elements,
  ids,
  classes,
}: {
  elements: CanvasElement[];
  ids: number[];
  classes: string[];
}) {
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ elements, ids, classes }));
    } catch {}
  }, [elements, ids, classes]);
}

// Info panel resizing effect
export function useInfoPanelResize({
  isResizingInfoPanel,
  isInfoPanelOpen,
  mainContainerRef,
  setInfoPanelWidth,
  setIsResizingInfoPanel,
}: {
  isResizingInfoPanel: boolean;
  isInfoPanelOpen: boolean;
  mainContainerRef: React.RefObject<HTMLDivElement | null>;
  setInfoPanelWidth: (width: number) => void;
  setIsResizingInfoPanel: (isResizing: boolean) => void;
}) {
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingInfoPanel || !mainContainerRef.current || !isInfoPanelOpen)
        return;

      const containerRect = mainContainerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - event.clientX;
      const maxWidthBasedOnViewport =
        window.innerWidth * MAX_INFO_PANEL_VIEWPORT_RATIO;
      const maxAllowedWidth = Math.min(
        containerRect.width - INFO_PANEL_OFFSET,
        maxWidthBasedOnViewport
      );

      if (newWidth >= MIN_INFO_PANEL_WIDTH && newWidth <= maxAllowedWidth) {
        setInfoPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingInfoPanel) {
        setIsResizingInfoPanel(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isResizingInfoPanel,
    isInfoPanelOpen,
    mainContainerRef,
    setInfoPanelWidth,
    setIsResizingInfoPanel,
  ]);
}

// Canvas submission handler
export function useCanvasSubmission({
  selectedQuestionIndex,
  selectedQuestionType,
  elements,
  setSubmissionResults,
  setActiveInfoTab,
}: {
  selectedQuestionIndex: number | null;
  selectedQuestionType: "test" | "practice" | null;
  elements: CanvasElement[];
  setSubmissionResults: (results: SubmissionResult) => void;
  setActiveInfoTab: (tab: Tab) => void;
}) {
  const handleCanvasSubmit = async () => {
    if (selectedQuestionIndex === null || selectedQuestionType === null) {
      setSubmissionResults(null);
      setActiveInfoTab("feedback");
      return;
    }

    const validElements = elements.filter((element) => !element.invalidated);

    try {
      const result = await submitCanvas(
        validElements,
        selectedQuestionIndex,
        selectedQuestionType
      );

      if (result !== undefined) {
        setSubmissionResults(result);
      }
      setActiveInfoTab("feedback");
    } catch (error) {
      console.error("Canvas submission failed:", error);
    }
  };

  return { handleCanvasSubmit };
}
