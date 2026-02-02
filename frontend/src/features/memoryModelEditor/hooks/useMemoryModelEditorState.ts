import { useState } from "react";
import {
  CanvasElement,
  ID,
  SubmissionResult,
  Tab,
  PaletteTab,
} from "../../shared/types";
import {
  loadInitialCanvasData,
  loadInitialUIData,
  clearCanvasStorage,
} from "../utils/localStorage";
import type { QuestionView } from "../utils/localStorage";

// Layout constants
const DEFAULT_INFO_PANEL_WIDTH = 500;

export function useMemoryModelEditorState(sandbox: boolean) {
  // Load initial data
  const initialCanvasData = loadInitialCanvasData();
  const initialUIData = loadInitialUIData();

  // Canvas state
  const [canvasResetKey, setCanvasResetKey] = useState(0);
  const [elements, setElements] = useState<CanvasElement[]>(
    initialCanvasData.elements
  );
  const [elementIds, setElementIds] = useState<number[]>(initialCanvasData.ids);
  const [elementClasses, setElementClasses] = useState<string[]>(
    initialCanvasData.classes
  );
  const [jsonOutput, setJsonOutput] = useState<string>("");

  // UI state
  const [activeInfoTab, setActiveInfoTab] = useState<Tab>(
    initialUIData.activeTab
  );
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<
    number | null
  >(initialUIData.questionIndex);
  const [selectedQuestionType, setSelectedQuestionType] = useState<
    "test" | "practice" | "prep" | null
  >(initialUIData.questionType);
  const [submissionResults, setSubmissionResults] = useState<SubmissionResult | null>(
    initialUIData.submissionResults
  );
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(() =>
    typeof initialUIData.sandboxMode === "boolean"
      ? initialUIData.sandboxMode
      : sandbox
  );
  const [questionView, setQuestionView] = useState<QuestionView>(
    initialUIData.questionView ?? "root"
  );

  // Scroll positions for info panel tabs (persists across panel close/open)
  const [tabScrollPositions, setTabScrollPositions] = useState<Record<Tab, number>>({
    question: 0,
    feedback: 0,
  });

  // Panel state
  const [activePaletteTab, setActivePaletteTab] = useState<PaletteTab>("all");
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(
    typeof initialUIData.isInfoPanelOpen === "boolean" ? initialUIData.isInfoPanelOpen : true
  );
  const [infoPanelWidth, setInfoPanelWidth] = useState<number>(
    DEFAULT_INFO_PANEL_WIDTH
  );
  const [isResizingInfoPanel, setIsResizingInfoPanel] =
    useState<boolean>(false);

  // Modal state
  const [showClearCanvasModal, setShowClearCanvasModal] =
    useState<boolean>(false);
  const [showModeToggleModal, setShowModeToggleModal] =
    useState<boolean>(false);

  return {
    // Canvas state
    canvasResetKey,
    setCanvasResetKey,
    elements,
    setElements,
    elementIds,
    setElementIds,
    elementClasses,
    setElementClasses,
    jsonOutput,
    setJsonOutput,

    // UI state
    activeInfoTab,
    setActiveInfoTab,
    selectedQuestionIndex,
    setSelectedQuestionIndex,
    selectedQuestionType,
    setSelectedQuestionType,
    submissionResults,
    setSubmissionResults,
    isSandboxMode,
    setIsSandboxMode,
    questionView,
    setQuestionView,
    tabScrollPositions,
    setTabScrollPositions,

    // Panel state
    activePaletteTab,
    setActivePaletteTab,
    isPaletteOpen,
    setIsPaletteOpen,
    isInfoPanelOpen,
    setIsInfoPanelOpen,
    infoPanelWidth,
    setInfoPanelWidth,
    isResizingInfoPanel,
    setIsResizingInfoPanel,

    // Modal state
    showClearCanvasModal,
    setShowClearCanvasModal,
    showModeToggleModal,
    setShowModeToggleModal,
  };
}

export { clearCanvasStorage };
