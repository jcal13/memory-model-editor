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
import { SubmissionResult } from "../../shared/types";
import type { QuestionView } from "../../memoryModelEditor/utils/localStorage";
import {
  CanvasData,
  deleteQuestionCanvasData,
  getDoNotRemindCanvasClear,
  resolveQuestionCanvasData,
  saveQuestionCanvasData,
  setDoNotRemindCanvasClear,
} from "../../memoryModelEditor/utils/localStorage";
import ConfirmationModal from "../../memoryModelEditor/components/ConfirmationModal";

type View = "root" | "loading" | "test" | "list" | "question" | "practice" | "prep";
type QuestionType = "test" | "practice" | "prep";
type QuestionStatus = "unattempted" | "attempted" | "completed";

const QUESTION_STATUS_KEY = "questionStatus";
const VALID_VIEWS: View[] = [
  "root",
  "loading",
  "test",
  "list",
  "question",
  "practice",
  "prep",
];

interface QuestionStatusMap {
  [key: string]: QuestionStatus;
}

interface QuestionData {
  id: number;
  question: string;
  code: string[];
  answer: unknown;
  description?: string | null;
  topics?: string[] | null;
  canvasConfig?: CanvasData | null;
}

function formatSource(description: string): string {
  // "CSC148 2023 midterm 1" → "CSC148 · 2023 · Midterm 1"
  // "CSC148 2024 final"     → "CSC148 · 2024 · Final"
  const parts = description.trim().split(/\s+/);
  if (parts.length < 2) return description;
  const [course, year, ...rest] = parts;
  const label = rest.map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p)).join(" ");
  return label ? `${course} · ${year} · ${label}` : `${course} · ${year}`;
}

interface QuestionTabProps {
  questionIndex: number | null;
  setQuestionIndex: (index: number | null) => void;
  questionType: "test" | "practice" | "prep" | null;
  setQuestionType: (type: "test" | "practice" | "prep" | null) => void;
  questionView: QuestionView;
  setQuestionView: (view: QuestionView) => void;
  onSubmit: () => Promise<boolean>;
  setSubmissionResults: (results: SubmissionResult | null) => void;
  onClearCanvas: () => void;
  onRestoreCanvas: (elements: any[], ids: number[], classes: string[]) => void;
  currentCanvasState: { elements: any[]; ids: number[]; classes: string[] };
  onQuestionDataChange?: (data: any) => void;
  isSandboxMode: boolean;
}

function loadQuestionStatus(): QuestionStatusMap {
  try {
    const rawData = localStorage.getItem(QUESTION_STATUS_KEY);
    if (!rawData) return {};
    return JSON.parse(rawData) ?? {};
  } catch {
    return {};
  }
}

function persistQuestionStatus(statusMap: QuestionStatusMap): void {
  try {
    localStorage.setItem(QUESTION_STATUS_KEY, JSON.stringify(statusMap));
  } catch (error) {
    console.warn("Failed to persist question status:", error);
  }
}

function getQuestionKey(type: QuestionType, index: number): string {
  return `${type}_${index}`;
}

export default function QuestionTab({
  questionIndex,
  setQuestionIndex,
  questionType,
  setQuestionType,
  questionView: questionViewProp,
  setQuestionView,
  onSubmit,
  setSubmissionResults,
  onClearCanvas,
  onRestoreCanvas,
  currentCanvasState,
  onQuestionDataChange,
  isSandboxMode,
}: QuestionTabProps) {
  const [view, setView] = useState<View>(
    () => (VALID_VIEWS.includes(questionViewProp as View) && questionViewProp !== "loading" ? (questionViewProp as View) : "root")
  );
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [questionStatus, setQuestionStatus] = useState<QuestionStatusMap>(() =>
    loadQuestionStatus()
  );
  const [showCanvasClearModal, setShowCanvasClearModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: "test" | "practice" | "prep";
    index: number;
  } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const hydratedList = useRef<boolean>(false);
  const hydratedQuestion = useRef<boolean>(false);
  const previousQuestionRef = useRef<{
    type: "test" | "practice" | "prep";
    index: number;
  } | null>(null);
  const prevSandboxModeRef = useRef<boolean>(isSandboxMode);

  useEffect(() => {
    if (view !== "loading") {
      setQuestionView(view as QuestionView);
    }
  }, [view, setQuestionView]);

  useEffect(() => {
    persistQuestionStatus(questionStatus);
  }, [questionStatus]);

  useEffect(() => {
    if (previousQuestionRef.current && currentCanvasState.elements.length > 0) {
      const { type, index } = previousQuestionRef.current;
      saveQuestionCanvasData(type, index, currentCanvasState);
    }

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

  useEffect(() => {
    if (view !== "question" && onQuestionDataChange) {
      onQuestionDataChange(null);
    }
  }, [view, onQuestionDataChange]);

  useEffect(() => {
    if (prevSandboxModeRef.current === isSandboxMode) return;
    prevSandboxModeRef.current = isSandboxMode;

    setView("root");
    setQuestionData(null);
    setQuestionIndex(null);
    setQuestionType(null);
    setQuestionView("root");
    hydratedList.current = false;
    hydratedQuestion.current = false;
    previousQuestionRef.current = null;
  }, [isSandboxMode, setQuestionIndex, setQuestionType, setQuestionView]);

  const updateQuestionStatus = (
    type: QuestionType,
    index: number,
    status: QuestionStatus
  ) => {
    const key = getQuestionKey(type, index);
    setQuestionStatus((prev) => ({ ...prev, [key]: status }));
  };

  const getQuestionStatus = (
    type: QuestionType,
    index: number
  ): QuestionStatus => {
    const key = getQuestionKey(type, index);
    return questionStatus[key] || "unattempted";
  };

  const handleSubmit = async () => {
    if (questionType && questionIndex !== null) {
      try {
        const success = await onSubmit();
        updateQuestionStatus(
          questionType,
          questionIndex,
          success ? "completed" : "attempted"
        );
      } catch (error) {
        console.error("Error during submission:", error);
        updateQuestionStatus(questionType, questionIndex, "attempted");
      }
    } else {
      await onSubmit();
    }
  };

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
    type: QuestionType,
    id: number
  ): Promise<void> => {
    hydratedQuestion.current = false;
    setQuestionData(null);
    setSubmissionResults(null);

    setView("loading");

    try {
      const data = await fetchQuestion<QuestionData>(id, type);

      setQuestionType(type);
      setQuestionIndex(id);
      setQuestionData(data);

      if (onQuestionDataChange) {
        onQuestionDataChange(data);
      }

      setView("question");

      setTimeout(() => {
        const resolvedCanvas = resolveQuestionCanvasData(
          type,
          id,
          data.canvasConfig ?? null
        );
        onRestoreCanvas(
          resolvedCanvas.elements,
          resolvedCanvas.ids,
          resolvedCanvas.classes
        );
      }, 0);
    } catch (error) {
      console.error("Failed to load question:", error);
      setView("list");
    }
  };

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

    setQuestionIndex(null);
    setQuestionData(null);
    hydratedQuestion.current = false;
    onRestoreCanvas([], [], []);
    setView("list");
  };

  const handleCanvasClearConfirm = () => {
    setShowCanvasClearModal(false);
    if (pendingNavigation) {
      if (pendingNavigation.index === -1) {
        setQuestionIndex(null);
        setQuestionData(null);
        hydratedQuestion.current = false;
        onRestoreCanvas([], [], []);
        setView("list");
      } else {
        proceedWithQuestionLoad(
          pendingNavigation.type,
          pendingNavigation.index
        );
      }
      setPendingNavigation(null);
    }
  };

  const handleCanvasClearCancel = () => {
    setShowCanvasClearModal(false);
    setPendingNavigation(null);
  };

  const handleDoNotRemindChange = (checked: boolean) => {
    setDoNotRemindCanvasClear(checked);
  };

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
          const data = await fetchQuestion<QuestionData>(
            questionIndex,
            questionType
          );
          setQuestionData(data);

          if (onQuestionDataChange) {
            onQuestionDataChange(data);
          }
        } catch (error) {
          console.error("Failed to hydrate question:", error);
          setView("list");
        }
      })();
    }
  }, [view, questionType, questionIndex, questionData, onQuestionDataChange]);

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
    if (view === "list" && questionType === "prep") {
      return "CSC148 Prep Questions";
    }
    return "Questions";
  };

  const handleResetQuestion = () => {
    setShowResetModal(true);
  };

  const handleResetConfirm = () => {
    if (questionType && questionIndex !== null) {
      deleteQuestionCanvasData(questionType, questionIndex);
      const resolvedCanvas = resolveQuestionCanvasData(
        questionType,
        questionIndex,
        questionData?.canvasConfig ?? null
      );
      onRestoreCanvas(
        resolvedCanvas.elements,
        resolvedCanvas.ids,
        resolvedCanvas.classes
      );
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
        <div className={styles.titleRow}>
          {(view === "list" || view === "question") && (
            <button
              type="button"
              onClick={view === "list" ? () => { setQuestionIndex(null); setView("root"); } : navigateToList}
              className={styles.backBtn}
            >
              ← Back
            </button>
          )}
          <div className={styles.titleStack}>
            <h1 className={styles.title}>{getHeading()}</h1>
            {view === "question" && questionType === "test" && questionData?.description && (
              <p className={styles.sourceText}>{formatSource(questionData.description)}</p>
            )}
          </div>
        </div>

        {view === "root" && (
          <div className={styles.selectors}>
            <QuestionSelector
              variant="category"
              text="Practice Questions"
              subtitle="Sharpen your skills"
              icon="✏️"
              categoryType="practice"
              onClick={() => loadQuestions("practice")}
            />
            <QuestionSelector
              variant="category"
              text="Test Questions"
              subtitle="Put your knowledge to the test"
              icon="📝"
              categoryType="test"
              onClick={() => loadQuestions("test")}
            />
            <QuestionSelector
              variant="category"
              text="CSC148 Prep Questions"
              subtitle=""
              icon="🔗"
              categoryType="prep"
              onClick={() => loadQuestions("prep")}
            />
          </div>
        )}

        {view === "loading" && <p className={styles.loading}>Loading...</p>}

        {view === "list" && (
          <>
            <div className={styles.scroller}>
              <div className={styles.questionGrid}>
                {Array.from({ length: questionCount }, (_, index) => {
                  const questionNum = index + 1;
                  const status = questionType
                    ? getQuestionStatus(questionType, questionNum)
                    : "unattempted";

                  return (
                    <QuestionSelector
                      key={questionNum}
                      text={`Q${questionNum}`}
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
            <div className={styles.questionArea}>
              <details className={styles.topicsSection}>
                <summary className={styles.topicsSummary}>Topics</summary>
                <div className={styles.topicsContent}>
                  {(questionData.topics ?? []).length > 0 ? (
                    <div className={styles.topicChips}>
                      {(questionData.topics ?? []).map((topic, index) => (
                        <span
                          key={`${topic}-${index}`}
                          className={styles.topicChip}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.topicsEmpty}>
                      No topics listed yet.
                    </p>
                  )}
                </div>
              </details>

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
