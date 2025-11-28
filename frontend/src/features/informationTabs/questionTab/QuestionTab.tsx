import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  fetchQuestionCount,
  fetchQuestion,
} from "./utils/FetchQuestionService";
import QuestionSelector from "./components/QuestionSelector";
import CodeBlock from "./components/CodeBlock";
import styles from "./QuestionTab.module.css";
import "prismjs/themes/prism-tomorrow.css";
import { SubmitButton } from "./components/SubmitButton";
import { SubmissionResult } from "../../shared/types";
import {
  getDoNotRemindCanvasClear,
  saveQuestionCanvasData,
  setDoNotRemindCanvasClear,
  loadQuestionCanvasData,
  deleteQuestionCanvasData,
} from "../../memoryModelEditor/utils/localStorage";
import ConfirmationModal from "../../memoryModelEditor/components/ConfirmationModal";

type View = "root" | "loading" | "test" | "list" | "question" | "practice";
type QuestionType = "test" | "practice";
type QuestionStatus = "unattempted" | "attempted" | "completed";

// Constants
const UI_STORAGE_KEY = "uiState";
const QUESTION_STATUS_KEY = "questionStatus";
const VALID_VIEWS: View[] = [
  "root",
  "loading",
  "test",
  "list",
  "question",
  "practice",
];

interface QuestionStatusMap {
  [key: string]: QuestionStatus;
}

interface QuestionTabProps {
  questionIndex: number | null;
  setQuestionIndex: (index: number | null) => void;
  questionType: "test" | "practice" | null;
  setQuestionType: (type: "test" | "practice" | null) => void;
  onSubmit: () => Promise<boolean>;
  setSubmissionResults: (results: SubmissionResult | null) => void;
  onClearCanvas: () => void;
  onRestoreCanvas: (elements: any[], ids: number[], classes: string[]) => void;
  currentCanvasState: { elements: any[]; ids: number[]; classes: string[] };
}

/**
 * Loads saved question view from localStorage
 */
function loadSavedQuestionView(): View {
  try {
    const rawData = localStorage.getItem(UI_STORAGE_KEY);
    if (!rawData) return "root";

    const parsed = JSON.parse(rawData) ?? {};
    const view = parsed?.questionView as View | undefined;

    if (!view || !VALID_VIEWS.includes(view)) {
      return "root";
    }

    return view === "loading" ? "root" : view;
  } catch {
    return "root";
  }
}

/**
 * Persists question view to localStorage
 */
function persistQuestionView(view: View): void {
  try {
    const rawData = localStorage.getItem(UI_STORAGE_KEY);
    const parsed = rawData ? JSON.parse(rawData) ?? {} : {};
    parsed.questionView = view;
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.warn("Failed to persist question view:", error);
  }
}

/**
 * Loads question status from localStorage
 */
function loadQuestionStatus(): QuestionStatusMap {
  try {
    const rawData = localStorage.getItem(QUESTION_STATUS_KEY);
    if (!rawData) return {};
    return JSON.parse(rawData) ?? {};
  } catch {
    return {};
  }
}

/**
 * Persists question status to localStorage
 */
function persistQuestionStatus(statusMap: QuestionStatusMap): void {
  try {
    localStorage.setItem(QUESTION_STATUS_KEY, JSON.stringify(statusMap));
  } catch (error) {
    console.warn("Failed to persist question status:", error);
  }
}

/**
 * Gets the storage key for a specific question
 */
function getQuestionKey(type: QuestionType, index: number): string {
  return `${type}_${index}`;
}

export default function QuestionTab({
  questionIndex,
  setQuestionIndex,
  questionType,
  setQuestionType,
  onSubmit,
  setSubmissionResults,
  onClearCanvas,
  onRestoreCanvas,
  currentCanvasState,
}: QuestionTabProps) {
  const [view, setView] = useState<View>(() => loadSavedQuestionView());
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [questionData, setQuestionData] = useState<any>(null);
  const [questionStatus, setQuestionStatus] = useState<QuestionStatusMap>(() =>
    loadQuestionStatus()
  );
  const [showCanvasClearModal, setShowCanvasClearModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: "test" | "practice";
    index: number;
  } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Refs to track hydration state
  const hydratedList = useRef<boolean>(false);
  const hydratedQuestion = useRef<boolean>(false);
  const previousQuestionRef = useRef<{
    type: "test" | "practice";
    index: number;
  } | null>(null);

  // Persist view changes
  useEffect(() => {
    persistQuestionView(view);
  }, [view]);

  // Persist status changes
  useEffect(() => {
    persistQuestionStatus(questionStatus);
  }, [questionStatus]);

  useEffect(() => {
    // Save current canvas state when question changes
    if (previousQuestionRef.current && currentCanvasState.elements.length > 0) {
      const { type, index } = previousQuestionRef.current;
      saveQuestionCanvasData(type, index, currentCanvasState);
    }

    // Update ref to current question
    if (questionType && questionIndex !== null) {
      previousQuestionRef.current = {
        type: questionType,
        index: questionIndex,
      };
    } else {
      previousQuestionRef.current = null;
    }
  }, [questionIndex, questionType, currentCanvasState]);

  useEffect(() => {
    setDoNotRemindCanvasClear(false);
  }, []);

  /**
   * Updates the status of a specific question
   */
  const updateQuestionStatus = (
    type: QuestionType,
    index: number,
    status: QuestionStatus
  ): void => {
    const key = getQuestionKey(type, index);
    setQuestionStatus((prev) => ({
      ...prev,
      [key]: status,
    }));
  };

  /**
   * Gets the status of a specific question
   */
  const getQuestionStatus = (
    type: QuestionType,
    index: number
  ): QuestionStatus => {
    const key = getQuestionKey(type, index);
    return questionStatus[key] || "unattempted";
  };

  /**
   * Marks current question as attempted when navigating to it
   */
  const markQuestionAsAttempted = (type: QuestionType, index: number): void => {
    const currentStatus = getQuestionStatus(type, index);
    if (currentStatus === "unattempted") {
      updateQuestionStatus(type, index, "attempted");
    }
  };

  /**
   * Handles submission and marks question based on result
   */
  const handleSubmit = async (): Promise<void> => {
    if (questionType && questionIndex !== null) {
      try {
        const isCorrect = await onSubmit();
        updateQuestionStatus(
          questionType,
          questionIndex,
          isCorrect ? "completed" : "attempted"
        );
      } catch (error) {
        console.error("Error during submission:", error);
        // Mark as attempted if submission fails
        updateQuestionStatus(questionType, questionIndex, "attempted");
      }
    } else {
      await onSubmit();
    }
  };

  /**
   * Loads questions for a given type
   */
  const loadQuestions = async (questionType: QuestionType): Promise<void> => {
    onClearCanvas();

    setView("loading");
    try {
      const count = await fetchQuestionCount(questionType);
      setQuestionCount(count);
      setQuestionType(questionType);
      setQuestionIndex(null);
      setView("list");
    } catch (error) {
      console.error("Failed to load questions:", error);
      setView("root");
    }
  };

  /**
   * Loads a single question by ID
   */
  const loadSingleQuestion = async (id: number): Promise<void> => {
    if (!questionType) {
      setView("root");
      return;
    }

    const hasCanvasContent = currentCanvasState.elements.length > 0;
    const doNotRemind = getDoNotRemindCanvasClear();
    const isNavigatingFromQuestion =
      previousQuestionRef.current !== null &&
      previousQuestionRef.current.index !== id;

    // console.log("Navigation Debug:", {
    //   hasCanvasContent,
    //   doNotRemind,
    //   isNavigatingFromQuestion,
    //   previousQuestion: previousQuestionRef.current,
    //   targetQuestionId: id,
    //   elementsCount: currentCanvasState.elements.length,
    //   actualElements: currentCanvasState.elements,
    //   actualIds: currentCanvasState.ids,
    //   actualClasses: currentCanvasState.classes,
    //   currentCanvasStateRef: currentCanvasState,
    // });

    if (hasCanvasContent && !doNotRemind && isNavigatingFromQuestion) {
      const prevQuestion = previousQuestionRef.current!;
      saveQuestionCanvasData(
        prevQuestion.type,
        prevQuestion.index,
        currentCanvasState
      );

      setPendingNavigation({ type: questionType, index: id });
      setShowCanvasClearModal(true);
      return;
    }

    proceedWithQuestionLoad(questionType, id);
  };

  const proceedWithQuestionLoad = async (
    type: "test" | "practice",
    id: number
  ): Promise<void> => {
    setView("loading");

    // Clear canvas first
    onClearCanvas();

    try {
      const data = await fetchQuestion(id, type);
      setQuestionIndex(id);
      setQuestionData(data);
      setView("question");

      // Restore saved canvas state for this question if it exists
      const savedCanvas = loadQuestionCanvasData(type, id);
      if (savedCanvas && savedCanvas.elements.length > 0) {
        onRestoreCanvas(
          savedCanvas.elements,
          savedCanvas.ids,
          savedCanvas.classes
        );
      }
    } catch (error) {
      console.error("Failed to load question:", error);
      setView("list");
    }
  };

  const handleCanvasClearCancel = () => {
    setShowCanvasClearModal(false);
    setPendingNavigation(null);
  };

  const handleDoNotRemindChange = (checked: boolean) => {
    setDoNotRemindCanvasClear(checked);
  };

  /**
   * Navigates back to list view with proper hydration
   */
  const navigateToList = async (): Promise<void> => {
    if (questionType && questionIndex !== null) {
      const hasCanvasContent = currentCanvasState.elements.length > 0;
      const doNotRemind = getDoNotRemindCanvasClear();

      if (hasCanvasContent && !doNotRemind) {
        saveQuestionCanvasData(questionType, questionIndex, currentCanvasState);

        setPendingNavigation({ type: "list" as any, index: -1 });
        setShowCanvasClearModal(true);
        return;
      }

      saveQuestionCanvasData(questionType, questionIndex, currentCanvasState);
    }

    await proceedToList();
  };

  /**
   * Helper function to handle actual navigation to list
   */
  const proceedToList = async (): Promise<void> => {
    onClearCanvas();

    if (questionType) {
      try {
        const count = await fetchQuestionCount(questionType);
        setQuestionCount(count);
        setView("list");
      } catch (error) {
        console.error("Failed to load questions:", error);
        setView("root");
      }
    } else {
      setView("root");
    }
  };

  const handleCanvasClearConfirm = () => {
    setShowCanvasClearModal(false);
    if (pendingNavigation) {
      if (pendingNavigation.index === -1) {
        proceedToList();
      } else {
        proceedWithQuestionLoad(
          pendingNavigation.type,
          pendingNavigation.index
        );
      }
      setPendingNavigation(null);
    }
  };

  // Hydrate list view
  useEffect(() => {
    if (view === "list" && questionType && !hydratedList.current) {
      hydratedList.current = true;
      fetchQuestionCount(questionType)
        .then((count) => setQuestionCount(count))
        .catch((error) => {
          console.error("Failed to hydrate list:", error);
          setView("root");
        });
    }
  }, [view, questionType]);

  // Hydrate question view
  useEffect(() => {
    if (
      view === "question" &&
      questionType &&
      questionIndex !== null &&
      !questionData &&
      !hydratedQuestion.current
    ) {
      hydratedQuestion.current = true;
      (async () => {
        try {
          const data = await fetchQuestion(questionIndex, questionType);
          setQuestionData(data);
        } catch (error) {
          console.error("Failed to hydrate question:", error);
          setView("list");
        }
      })();
    }
  }, [view, questionType, questionIndex, questionData]);

  // Validate view state
  useEffect(() => {
    if (view === "list" && !questionType) setView("root");
    if (view === "question" && (!questionType || questionIndex === null)) {
      setView("root");
    }
  }, [view, questionType, questionIndex]);

  useEffect(() => {
    return () => {
      setSubmissionResults(null);
    };
  }, [questionIndex, setSubmissionResults]);

  // Calculate heading
  const getHeading = (): string => {
    if (view === "question" && questionIndex !== null) {
      return `Question ${questionIndex}`;
    }
    if (view === "list" && questionType === "test") {
      return "Test Questions";
    }
    if (view === "list" && questionType === "practice") {
      return "Practice Questions";
    }
    return "Questions";
  };

  const handleResetQuestion = () => {
    setShowResetModal(true);
  };

  const handleResetConfirm = () => {
    if (questionType && questionIndex !== null) {
      deleteQuestionCanvasData(questionType, questionIndex);

      onClearCanvas();

      setSubmissionResults(null);
      updateQuestionStatus(questionType, questionIndex, "unattempted");
    }
    setShowResetModal(false);
  };

  const handleResetCancel = () => {
    setShowResetModal(false);
  };

  return (
    <>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>{getHeading()}</h1>

        {view === "root" && (
          <div className={styles.selectors}>
            <QuestionSelector
              text="Practice Questions"
              onClick={() => loadQuestions("practice")}
            />
            <QuestionSelector
              text="Test Questions"
              onClick={() => loadQuestions("test")}
            />
          </div>
        )}

        {view === "loading" && <p className={styles.loading}>Loading...</p>}

        {view === "list" && (
          <>
            <div className={styles.backRow}>
              <button
                type="button"
                onClick={() => {
                  setQuestionIndex(null);
                  setView("root");
                }}
                className={styles.backBtn}
              >
                ← Back
              </button>
            </div>

            <div className={styles.scroller}>
              <div className={styles.selectors}>
                {Array.from({ length: questionCount }, (_, index) => {
                  const questionNum = index + 1;
                  const status = questionType
                    ? getQuestionStatus(questionType, questionNum)
                    : "unattempted";

                  return (
                    <QuestionSelector
                      key={questionNum}
                      text={`Question ${questionNum}`}
                      onClick={() => loadSingleQuestion(questionNum)}
                      status={status}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}

        {view === "question" && questionData && (
          <>
            <div className={styles.backRow}>
              <button
                type="button"
                onClick={navigateToList}
                className={styles.backBtn}
              >
                ← Back
              </button>
            </div>

            <div className={styles.questionArea}>
              <div className={styles.questionText}>
                <ReactMarkdown>{questionData.question}</ReactMarkdown>
              </div>

              <CodeBlock
                code={questionData.code.join("\n")}
                language="python"
              />

              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.resetButton}
                  onClick={handleResetQuestion}
                  aria-label="Reset Question"
                  title="Reset Question"
                >
                  Reset
                </button>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={handleSubmit}
                  aria-label="Submit Canvas"
                  title="Submit Canvas"
                >
                  Submit
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {showCanvasClearModal && (
        <ConfirmationModal
          title="Clear Canvas?"
          message="The canvas will be cleared when navigating to a different question. Your current work will be saved and restored if you return to this question."
          confirmLabel="Continue"
          cancelLabel="Cancel"
          onConfirm={handleCanvasClearConfirm}
          onCancel={handleCanvasClearCancel}
          showCheckbox={true}
          checkboxLabel="Do not remind me again"
          onCheckboxChange={handleDoNotRemindChange}
        />
      )}
      {showResetModal && (
        <ConfirmationModal
          title="Reset Question?"
          message="This will clear your canvas work for this question and mark it as unattempted. This action cannot be undone."
          confirmLabel="Reset"
          cancelLabel="Cancel"
          onConfirm={handleResetConfirm}
          onCancel={handleResetCancel}
        />
      )}
    </>
  );
}
