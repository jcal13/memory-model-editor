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
} from "./useEffect";

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
    "test" | "practice" | null
  >(initialUIData.questionType);
  const [submissionResults, setSubmissionResults] = useState<SubmissionResult>(
    initialUIData.submissionResults
  );
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(() =>
    typeof initialUIData.sandboxMode === "boolean"
      ? initialUIData.sandboxMode
      : sandbox
  );

  // Panel state
  const [activePaletteTab, setActivePaletteTab] = useState<PaletteTab>("all");
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(true);
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

  // Canvas management functions
  const clearCanvas = (): void => {
    setElements([]);
    setElementIds([]);
    setElementClasses([]);
    setJsonOutput("");
    setSubmissionResults(null);
    setCanvasResetKey((prev) => prev + 1);
    clearCanvasStorage();
  };

  // Element ID management
  const addElementId = (id: number) => {
    setElementIds((prevIds) => {
      if (prevIds.includes(id)) return prevIds;

      const insertIndex = prevIds.findIndex((existingId) => existingId > id);
      return insertIndex === -1
        ? [...prevIds, id]
        : [...prevIds.slice(0, insertIndex), id, ...prevIds.slice(insertIndex)];
    });
  };

  const removeElementId = (id: ID) => {
    setElementIds((prevIds) =>
      prevIds.filter((existingId) => existingId !== id)
    );
  };

  // Element class management
  const addElementClass = (className: string) => {
    setElementClasses((prevClasses) => {
      if (prevClasses.includes(className)) return prevClasses;

      const insertIndex = prevClasses.findIndex(
        (existingClass) => existingClass.localeCompare(className) > 0
      );
      return insertIndex === -1
        ? [...prevClasses, className]
        : [
            ...prevClasses.slice(0, insertIndex),
            className,
            ...prevClasses.slice(insertIndex),
          ];
    });
  };

  const removeElementClass = (className: string) => {
    setElementClasses((prevClasses) =>
      prevClasses.filter((existingClass) => existingClass !== className)
    );
  };

  return {
    // Canvas state
    canvasResetKey,
    elements,
    setElements,
    elementIds,
    elementClasses,
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

    // Functions
    clearCanvas,
    addElementId,
    removeElementId,
    addElementClass,
    removeElementClass,
  };
}
