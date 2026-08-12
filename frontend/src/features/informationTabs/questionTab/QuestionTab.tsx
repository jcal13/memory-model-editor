import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  fetchQuestionCount,
  fetchQuestion,
  fetchQuestionTopics,
} from "./utils/FetchQuestionService";
import { deriveAllTopics, filterQuestionIds } from "./utils/topicFilter";
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
import { normalizeQuestionCanvasData } from "../../memoryModelEditor/utils/questionFrames";
import ConfirmationModal from "../../memoryModelEditor/components/ConfirmationModal";

type View = "root" | "loading" | "test" | "list" | "question" | "practice" | "prep" | "experiment" | "stepbystep";
type QuestionType = "test" | "practice" | "prep" | "experiment";
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
  "experiment",
  "stepbystep",
];

interface QuestionStatusMap {
  [key: string]: QuestionStatus;
}

export interface QuestionData {
  id: number;
  question: string;
  code: string[];
  answer: unknown;
  steps?: Array<{ lineNumber: number; iterationNumber?: number; answer: unknown }> | null;
  description?: string | null;
  topics?: string[] | null;
  canvasConfig?: CanvasData | null;
}

function formatSource(description: string): string {
  const parts = description.trim().split(/\s+/);
  if (parts.length < 2) return description;
  const [course, year, ...rest] = parts;
  const label = rest.map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p)).join(" ");
  return label ? `${course} · ${year} · ${label}` : `${course} · ${year}`;
}

interface QuestionTabProps {
  questionIndex: number | null;
  setQuestionIndex: (index: number | null) => void;
  questionType: "test" | "practice" | "prep" | "experiment" | null;
  setQuestionType: (type: "test" | "practice" | "prep" | "experiment" | null) => void;
  questionView: QuestionView;
  setQuestionView: (view: QuestionView) => void;
  onSubmit: () => Promise<boolean>;
  onSubmitAtLine: (lineNumber: number, iterationNumber?: number) => Promise<boolean>;
  setSubmissionResults: (results: SubmissionResult | null) => void;
  onClearCanvas: () => void;
  onRestoreCanvas: (elements: any[], ids: number[], classes: string[]) => void;
  currentCanvasState: { elements: any[]; ids: number[]; classes: string[] };
  onQuestionDataChange?: (data: any) => void;
  isSandboxMode: boolean;
  fontScale?: number;
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

export function getCheckableLines(questionData: QuestionData | null): Set<number> {
  return new Set(questionData?.steps?.map((s) => s.lineNumber) ?? []);
}

export function sortCheckableLines(checkableLines: Set<number>): number[] {
  return Array.from(checkableLines).sort((a, b) => a - b);
}

export function buildLineIterations(questionData: QuestionData | null): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const s of questionData?.steps ?? []) {
    if (s.iterationNumber !== undefined) {
      const arr = map.get(s.lineNumber) ?? [];
      arr.push(s.iterationNumber);
      map.set(s.lineNumber, arr);
    }
  }
  map.forEach((values) => values.sort((a: number, b: number) => a - b));
  return map;
}

export function getNextCheckableLine(sortedLines: number[], line: number | null): number | null {
  if (line === null) return null;
  const idx = sortedLines.indexOf(line);
  return idx >= 0 && idx + 1 < sortedLines.length ? sortedLines[idx + 1] : null;
}

export interface StepAssignments {
  variableToId: Record<string, number>;  // "a" → 1
  idToType: Record<number, string>;       // 1 → "int"
}

export function extractStepAssignments(elements: any[]): StepAssignments {
  const variableToId: Record<string, number> = {};
  const idToType: Record<number, string> = {};

  for (const el of elements) {
    if (el.kind?.name === "function") {
      for (const p of (el.kind.params ?? [])) {
        if (typeof p.targetId === "number") {
          variableToId[p.name] = p.targetId;
        }
      }
    } else if (el.kind?.name === "class") {
      for (const p of (el.kind.classVariables ?? [])) {
        if (typeof p.targetId === "number") {
          variableToId[p.name] = p.targetId;
        }
      }
    } else {
      if (typeof el.id === "number") {
        idToType[el.id] = el.kind?.type ?? "unknown";
      }
    }
  }

  return { variableToId, idToType };
}

export function checkStepConsistency(committed: StepAssignments, current: StepAssignments): string | null {
  for (const [varName, committedId] of Object.entries(committed.variableToId)) {
    const currentId = current.variableToId[varName];
    if (currentId !== undefined && currentId !== committedId) {
      return `Variable "${varName}" must point to id ${committedId} (assigned in a previous step). You cannot reassign it to id ${currentId}.`;
    }
  }
  for (const [idStr, committedType] of Object.entries(committed.idToType)) {
    const id = parseInt(idStr, 10);
    const currentType = current.idToType[id];
    if (currentType !== undefined && currentType !== committedType) {
      return `Id ${id} was a ${committedType} in a previous step and cannot be changed to a ${currentType}.`;
    }
  }
  return null;
}

export default function QuestionTab({
  questionIndex,
  setQuestionIndex,
  questionType,
  setQuestionType,
  questionView: questionViewProp,
  setQuestionView,
  onSubmit,
  onSubmitAtLine,
  setSubmissionResults,
  onClearCanvas,
  onRestoreCanvas,
  currentCanvasState,
  onQuestionDataChange,
  isSandboxMode,
  fontScale = 1,
}: QuestionTabProps) {
  const [view, setView] = useState<View>(() => {
    const v = questionViewProp as View;
    return VALID_VIEWS.includes(v) && v !== "loading" && v !== "stepbystep" ? v : "root";
  });
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [questionStatus, setQuestionStatus] = useState<QuestionStatusMap>(() =>
    loadQuestionStatus()
  );
  const [showCanvasClearModal, setShowCanvasClearModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: "test" | "practice" | "prep" | "experiment";
    index: number;
  } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedIteration, setSelectedIteration] = useState<number | undefined>(undefined);
  const [topicMap, setTopicMap] = useState<Map<number, string[]>>(new Map());
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const allTopics = useMemo(() => deriveAllTopics(topicMap), [topicMap]);

  const filteredQuestionIds = useMemo(
    () => filterQuestionIds(topicMap, questionCount, selectedTopic),
    [selectedTopic, topicMap, questionCount]
  );
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [stepByStepIndex, setStepByStepIndex] = useState<number>(0);
  const [committedAssignments, setCommittedAssignments] = useState<StepAssignments | null>(null);
  const [stepConsistencyError, setStepConsistencyError] = useState<string | null>(null);

  const checkableLines = useMemo(() => getCheckableLines(questionData), [questionData]);

  const lineIterations = useMemo(() => buildLineIterations(questionData), [questionData]);

  const hydratedList = useRef<boolean>(false);
  const hydratedQuestion = useRef<boolean>(false);
  const previousQuestionRef = useRef<{
    type: "test" | "practice" | "prep" | "experiment";
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
    setTopicMap(new Map());
    setSelectedTopic(null);
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

  const getNextStep = (
    lineNumber: number,
    iterationNumber?: number
  ): { lineNumber: number; iterationNumber?: number } | null => {
    const steps = questionData?.steps;
    if (!steps) return null;
    const idx = steps.findIndex(
      (s) => s.lineNumber === lineNumber && s.iterationNumber === iterationNumber
    );
    if (idx < 0 || idx + 1 >= steps.length) return null;
    return steps[idx + 1];
  };

  const handleSubmitAtLine = async (lineNumber: number, iterationNumber?: number) => {
    if (!questionType || questionIndex === null) {
      return false;
    }

    try {
      const success = await onSubmitAtLine(lineNumber, iterationNumber);

      if (success && autoAdvance) {
        const nextStep = getNextStep(lineNumber, iterationNumber);
        if (nextStep !== null) {
          setSelectedLine(nextStep.lineNumber);
          setSelectedIteration(nextStep.iterationNumber);
        }
      }

      return success;
    } catch (error) {
      console.error("Error during line submission:", error);
      return false;
    }
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
    setSelectedTopic(null);
    try {
      const [count, topicData] = await Promise.all([
        fetchQuestionCount(questionType),
        fetchQuestionTopics(questionType),
      ]);
      setQuestionCount(count);
      setTopicMap(new Map(topicData.map(({ id, topics }) => [id, topics ?? []])));
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
    setSelectedLine(null);
    setSelectedIteration(undefined);

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
        const resolvedCanvas = normalizeQuestionCanvasData(
          resolveQuestionCanvasData(type, id, data.canvasConfig ?? null)
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
    setSelectedLine(null);
    setSelectedIteration(undefined);
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
        setSelectedLine(null);
        setSelectedIteration(undefined);
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
      Promise.all([
        fetchQuestionCount(questionType),
        fetchQuestionTopics(questionType),
      ])
        .then(([count, topicData]) => {
          setQuestionCount(count);
          setTopicMap(new Map(topicData.map(({ id, topics }) => [id, topics ?? []])));
        })
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
      setSubmissionResults(null);
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

          const resolvedCanvas = normalizeQuestionCanvasData(
            resolveQuestionCanvasData(
              questionType,
              questionIndex,
              data.canvasConfig ?? null
            )
          );
          onRestoreCanvas(
            resolvedCanvas.elements,
            resolvedCanvas.ids,
            resolvedCanvas.classes
          );
        } catch (error) {
          console.error("Failed to hydrate question:", error);
          setView("list");
        }
      })();
    }
  }, [
    view,
    questionType,
    questionIndex,
    questionData,
    onQuestionDataChange,
    onRestoreCanvas,
  ]);

  const getHeading = (): string => {
    if (view === "stepbystep" && questionIndex !== null) {
      return `Step-by-Step · Q${questionIndex}`;
    }
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
    if (view === "list" && questionType === "experiment") {
      return "Experiment Questions";
    }
    return "Questions";
  };

  const handleResetQuestion = () => {
    setShowResetModal(true);
  };

  const handleResetConfirm = async () => {
    if (!questionType || questionIndex === null) {
      setShowResetModal(false);
      return;
    }

    try {
      const freshQuestionData = await fetchQuestion<QuestionData>(
        questionIndex,
        questionType
      );

      deleteQuestionCanvasData(questionType, questionIndex);
      setQuestionData(freshQuestionData);

      if (onQuestionDataChange) {
        onQuestionDataChange(freshQuestionData);
      }

      const resolvedCanvas = normalizeQuestionCanvasData(
        resolveQuestionCanvasData(
          questionType,
          questionIndex,
          freshQuestionData.canvasConfig ?? null
        )
      );

      onRestoreCanvas(
        resolvedCanvas.elements,
        resolvedCanvas.ids,
        resolvedCanvas.classes
      );
      setSubmissionResults(null);
      updateQuestionStatus(questionType, questionIndex, "unattempted");
    } catch (error) {
      console.error("Failed to reset question:", error);
    } finally {
      setShowResetModal(false);
    }
  };

  const handleResetCancel = () => {
    setShowResetModal(false);
  };

  const loadStepByStepQuestion = async (): Promise<void> => {
    onClearCanvas();
    setStepByStepIndex(0);
    setCommittedAssignments(null);
    setStepConsistencyError(null);
    setSubmissionResults(null);
    setSelectedLine(null);
    setSelectedIteration(undefined);
    setView("loading");

    try {
      const data = await fetchQuestion<QuestionData>(1, "practice");
      setQuestionType("practice");
      setQuestionIndex(1);
      setQuestionData(data);
      if (onQuestionDataChange) onQuestionDataChange(data);
      setView("stepbystep");

      setTimeout(() => {
        const resolvedCanvas = normalizeQuestionCanvasData(
          resolveQuestionCanvasData("practice", 1, data.canvasConfig ?? null)
        );
        onRestoreCanvas(resolvedCanvas.elements, resolvedCanvas.ids, resolvedCanvas.classes);
      }, 0);
    } catch (error) {
      console.error("Failed to load step-by-step question:", error);
      setView("root");
    }
  };

  const navigateStepByStepToRoot = (): void => {
    deleteQuestionCanvasData("practice", 1);
    setStepByStepIndex(0);
    setCommittedAssignments(null);
    setStepConsistencyError(null);
    setQuestionIndex(null);
    setQuestionData(null);
    setSelectedLine(null);
    setSelectedIteration(undefined);
    setSubmissionResults(null);
    if (onQuestionDataChange) onQuestionDataChange(null);
    onRestoreCanvas([], [], []);
    setView("root");
  };

  const handleStepCheck = async (): Promise<void> => {
    if (!questionData?.steps || stepByStepIndex >= questionData.steps.length) return;

    // Snapshot canvas before the async call to avoid stale closure issues
    const snapshotElements = currentCanvasState.elements;
    const currentAssignments = extractStepAssignments(snapshotElements);

    // Enforce ID consistency with what was committed in earlier steps
    if (committedAssignments) {
      const consistencyError = checkStepConsistency(committedAssignments, currentAssignments);
      if (consistencyError) {
        setStepConsistencyError(consistencyError);
        return;
      }
    }
    setStepConsistencyError(null);

    const currentStep = questionData.steps[stepByStepIndex];
    const success = await handleSubmitAtLine(currentStep.lineNumber, currentStep.iterationNumber);
    if (success) {
      // Merge the new assignments into the committed state
      setCommittedAssignments((prev) => ({
        variableToId: { ...prev?.variableToId, ...currentAssignments.variableToId },
        idToType: { ...prev?.idToType, ...currentAssignments.idToType },
      }));
      setStepByStepIndex((prev) => prev + 1);
    }
  };

  const handleStepByStepReset = async (): Promise<void> => {
    try {
      const data = await fetchQuestion<QuestionData>(1, "practice");
      setQuestionData(data);
      if (onQuestionDataChange) onQuestionDataChange(data);
      setStepByStepIndex(0);
      setCommittedAssignments(null);
      setStepConsistencyError(null);
      setSubmissionResults(null);
      deleteQuestionCanvasData("practice", 1);
      const resolvedCanvas = normalizeQuestionCanvasData(
        resolveQuestionCanvasData("practice", 1, data.canvasConfig ?? null)
      );
      onRestoreCanvas(resolvedCanvas.elements, resolvedCanvas.ids, resolvedCanvas.classes);
    } catch (error) {
      console.error("Failed to reset step-by-step question:", error);
    }
  };

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.titleRow}>
          {(view === "list" || view === "question" || view === "stepbystep") && (
            <button
              type="button"
              onClick={
                view === "list"
                  ? () => { setQuestionIndex(null); setView("root"); }
                  : view === "stepbystep"
                  ? navigateStepByStepToRoot
                  : navigateToList
              }
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
              helpText="Build the memory model yourself. The palette only shows the boxes needed for the question, and you get feedback to help you learn."
            />
            <QuestionSelector
              variant="category"
              text="Test Questions"
              subtitle="Put your knowledge to the test"
              icon="📝"
              categoryType="test"
              onClick={() => loadQuestions("test")}
              helpText="Simulates exam conditions with the full palette of boxes available, so you decide what to use."
            />
            <QuestionSelector
              variant="category"
              text="CSC148 Prep Questions"
              subtitle=""
              icon="🎓"
              categoryType="prep"
              onClick={() => loadQuestions("prep")}
              helpText="Questions aligned to the CSC148 course curriculum, useful for reviewing course-specific material."
            />
            <QuestionSelector
              variant="category"
              text="Experiment Questions"
              subtitle=""
              icon="🧪"
              categoryType="experiment"
              onClick={() => loadQuestions("experiment")}
              helpText="Open-ended sandbox questions with no fixed answer to check against — freely explore how code affects the memory model."
            />
            <div className={styles.selectorDivider} />
            <QuestionSelector
              variant="category"
              text="Step-by-Step Questions"
              subtitle="Build the model one line at a time"
              icon="📋"
              categoryType="stepbystep"
              onClick={loadStepByStepQuestion}
            />
          </div>
        )}

        {view === "loading" && <p className={styles.loading}>Loading...</p>}

        {view === "list" && (
          <>
            {allTopics.length > 0 && (
              <div className={styles.topicFilter}>
                <button
                  type="button"
                  className={`${styles.topicFilterChip} ${selectedTopic === null ? styles.topicFilterChipActive : ""}`}
                  onClick={() => setSelectedTopic(null)}
                >
                  All
                </button>
                {allTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className={`${styles.topicFilterChip} ${selectedTopic === topic ? styles.topicFilterChipActive : ""}`}
                    onClick={() => setSelectedTopic((prev) => (prev === topic ? null : topic))}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.scroller}>
              <div className={styles.questionGrid}>
                {filteredQuestionIds.map((questionNum) => {
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

        {view === "question" && questionData && (() => {
          const selectedLineHasIterations =
            selectedLine !== null && (lineIterations.get(selectedLine)?.length ?? 0) > 0;
          const canCheckAtLine =
            selectedLine !== null &&
            checkableLines.has(selectedLine) &&
            (!selectedLineHasIterations || selectedIteration !== undefined);
          return (
            <>
              <div className={styles.questionArea} style={{ '--font-scale': fontScale } as React.CSSProperties}>
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
                  checkableLines={checkableLines}
                  selectedLine={selectedLine}
                  onLineClick={(n) => {
                    setSelectedLine((prev) => (prev === n ? null : n));
                    setSelectedIteration(undefined);
                  }}
                />

                {checkableLines.size > 0 && (
                  <p className={styles.lineHint}>
                    Click a highlighted line number to check your answer at that point.
                  </p>
                )}

                {checkableLines.size > 0 && (
                  <div className={styles.autoToolbar}>
                    <div
                      className={`${styles.toggleTrack} ${autoAdvance ? styles.toggleOn : ""}`}
                      onClick={() => setAutoAdvance(v => !v)}
                      role="switch"
                      aria-checked={autoAdvance}
                      aria-label="Auto advance to next checkable line"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === " " && setAutoAdvance(v => !v)}
                    >
                      <div className={styles.toggleThumb} />
                    </div>
                    <span className={styles.toolbarText}>auto-advance</span>

                    {selectedLine !== null && (lineIterations.get(selectedLine)?.length ?? 0) > 0 && (
                      <>
                        <div className={styles.toolbarDivider} />
                        <span className={styles.toolbarText}>iter:</span>
                        {(lineIterations.get(selectedLine) ?? []).map((iter) => (
                          <button
                            key={iter}
                            type="button"
                            className={`${styles.iterationBtn} ${selectedIteration === iter ? styles.iterationBtnActive : ""}`}
                            onClick={() => setSelectedIteration(prev => prev === iter ? undefined : iter)}
                          >
                            {iter}
                          </button>
                        ))}
                      </>
                    )}

                    {canCheckAtLine && (
                      <>
                        <div className={styles.toolbarDivider} />
                        <button
                          type="button"
                          className={styles.checkAtLineButton}
                          onClick={() => handleSubmitAtLine(selectedLine!, selectedIteration)}
                          aria-label={`Check answer at line ${selectedLine}`}
                          title={`Check answer at line ${selectedLine}`}
                        >
                          check line {selectedLine}{selectedIteration !== undefined ? ` · iter ${selectedIteration}` : ""}
                        </button>
                      </>
                    )}
                  </div>
                )}

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
          );
        })()}
        {view === "stepbystep" && questionData && (() => {
          const steps = questionData.steps ?? [];
          const allDone = stepByStepIndex >= steps.length;
          const currentStep = !allDone ? steps[stepByStepIndex] : null;
          const currentLine = currentStep?.lineNumber ?? null;

          return (
            <div className={styles.questionArea} style={{ '--font-scale': fontScale } as React.CSSProperties}>
              <div className={styles.stepIndicator}>
                <div className={styles.stepDots}>
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={`${styles.stepDot} ${
                        i < stepByStepIndex
                          ? styles.stepDotDone
                          : i === stepByStepIndex
                          ? styles.stepDotActive
                          : styles.stepDotPending
                      }`}
                    />
                  ))}
                </div>
                <span className={styles.stepText}>
                  {allDone
                    ? "All steps complete!"
                    : `Step ${stepByStepIndex + 1} of ${steps.length}`}
                </span>
              </div>

              <details className={styles.topicsSection}>
                <summary className={styles.topicsSummary}>Topics</summary>
                <div className={styles.topicsContent}>
                  {(questionData.topics ?? []).length > 0 ? (
                    <div className={styles.topicChips}>
                      {(questionData.topics ?? []).map((topic, index) => (
                        <span key={`${topic}-${index}`} className={styles.topicChip}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.topicsEmpty}>No topics listed yet.</p>
                  )}
                </div>
              </details>

              <div className={styles.questionText}>
                {allDone
                  ? "You correctly drew the memory model for each line, one step at a time."
                  : `Draw the memory model after executing line ${currentLine}.`}
              </div>

              <CodeBlock
                code={questionData.code.join("\n")}
                language="python"
                selectedLine={currentLine !== null ? currentLine : undefined}
              />

              {stepConsistencyError && (
                <div className={styles.stepConsistencyError}>
                  {stepConsistencyError}
                </div>
              )}

              <p className={styles.stepHint}>
                {allDone
                  ? "The canvas reflects the final state of memory."
                  : "Set up the memory model for the highlighted line, then click Check."}
              </p>

              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.resetButton}
                  onClick={handleStepByStepReset}
                >
                  {allDone ? "Try Again" : "Reset"}
                </button>
                {!allDone && (
                  <button
                    type="button"
                    className={styles.checkAtLineButton}
                    onClick={handleStepCheck}
                  >
                    Check Line {currentLine}
                  </button>
                )}
              </div>
            </div>
          );
        })()}
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
