import type { QuestionLink } from "./questionTab/utils/questionLinks";
import { useEffect, useRef, useState } from "react";
import { SubmissionResult, Tab, CanvasElement } from "../shared/types";
import { MasterErrorList } from "../memoryModelEditor/utils/masterErrorList";
import FeedbackTab from "./feedbackTab/FeedbackTab";
import QuestionTab from "./questionTab/QuestionTab";
import { useResizable } from "../palette/hooks/useResizable";
import styles from "./InformationTabs.module.css";

interface InformationTabsProps {
  linkedQuestion?: QuestionLink | null;
  onQuestionLinkConsumed?: () => void;
  submissionResults: SubmissionResult | null;
  questionSelected: boolean;
  questionIndex: number | null;
  setQuestionIndex: (index: number | null) => void;
  questionType: "test" | "practice" | "prep" | "experiment" | "study" | null;
  setQuestionType: (type: "test" | "practice" | "prep" | "experiment" | "study" | null) => void;
  questionView: import("../memoryModelEditor/utils/localStorage").QuestionView;
  setQuestionView: (view: import("../memoryModelEditor/utils/localStorage").QuestionView) => void;
  onSubmit: () => Promise<boolean>;
  onSubmitAtLine: (lineNumber: number, iterationNumber?: number) => Promise<boolean>;
  setSubmissionResults: (results: SubmissionResult | null) => void;
  onClearCanvas: () => void;
  onRestoreCanvas: (elements: any[], ids: number[], classes: string[]) => void;
  currentCanvasState: { elements: any[]; ids: number[]; classes: string[] };
  masterErrorList: MasterErrorList;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  onOpenEditor: (element: CanvasElement) => void;
  isSandboxMode: boolean;
  onQuestionDataChange?: (data: any) => void;
  tabScrollPositions: Record<Tab, number>;
  setTabScrollPositions: React.Dispatch<React.SetStateAction<Record<Tab, number>>>;
  fontScale?: number;
  /** "row": question and feedback side by side (question docked at the bottom). */
  layout?: "column" | "row";
}

export default function InformationTabs({
  linkedQuestion,
  onQuestionLinkConsumed,
  submissionResults,
  questionSelected,
  questionIndex,
  setQuestionIndex,
  questionType,
  setQuestionType,
  questionView,
  setQuestionView,
  onSubmit,
  onSubmitAtLine,
  setSubmissionResults,
  onClearCanvas,
  onRestoreCanvas,
  currentCanvasState,
  masterErrorList,
  elements,
  setElements,
  onOpenEditor,
  isSandboxMode,
  onQuestionDataChange,
  tabScrollPositions,
  setTabScrollPositions,
  fontScale = 1,
  layout = "column",
}: InformationTabsProps) {
  const row = layout === "row";
  const tabBodyRef = useRef<HTMLDivElement>(null);
  const { topHeight, handleMouseDown, containerRef } = useResizable({
    initialTopPercent: 60,
    minTopPercent: 30,
    maxTopPercent: 85,
  });
  // Track the last submission context so Resubmit repeats the same check
  type LastLineCtx = { line: number; iteration?: number } | null;
  const lastSubmitLineRef = useRef<LastLineCtx>(null);
  const [lastSubmitLine, setLastSubmitLine] = useState<LastLineCtx>(null);

  // Restore scroll position on mount
  useEffect(() => {
    if (tabBodyRef.current) {
      tabBodyRef.current.scrollTop = tabScrollPositions["question"];
    }
  }, []);

  // Save scroll position on unmount (panel close)
  useEffect(() => {
    const el = tabBodyRef.current;
    return () => {
      if (el) {
        setTabScrollPositions((prev) => ({
          ...prev,
          ["question"]: el.scrollTop,
        }));
      }
    };
  }, [setTabScrollPositions]);

  const handleSubmit = async () => {
    lastSubmitLineRef.current = null;
    setLastSubmitLine(null);
    const success = await onSubmit();
    return success;
  };

  const handleSubmitAtLine = async (lineNumber: number, iterationNumber?: number) => {
    const ctx = { line: lineNumber, iteration: iterationNumber };
    lastSubmitLineRef.current = ctx;
    setLastSubmitLine(ctx);
    return onSubmitAtLine(lineNumber, iterationNumber);
  };

  const handleResubmit = async () => {
    const ctx = lastSubmitLineRef.current;
    if (ctx !== null) {
      return onSubmitAtLine(ctx.line, ctx.iteration);
    }
    return onSubmit();
  };

  return (
    <div className={`${styles.containerWrapper} ${row ? styles.rowWrapper : ""}`}>
      <div className={`${styles.container} ${row ? styles.rowLayout : ""}`} ref={containerRef}>
        <div
          className={styles.questionPanel}
          ref={tabBodyRef}
          style={questionSelected && !row ? { height: `${topHeight}%` } : undefined}
        >
          <QuestionTab
            linkedQuestion={linkedQuestion}
            onQuestionLinkConsumed={onQuestionLinkConsumed}
            questionIndex={questionIndex}
            setQuestionIndex={setQuestionIndex}
            questionType={questionType}
            setQuestionType={setQuestionType}
            questionView={questionView}
            setQuestionView={setQuestionView}
            onSubmit={handleSubmit}
            onSubmitAtLine={handleSubmitAtLine}
            setSubmissionResults={setSubmissionResults}
            onClearCanvas={onClearCanvas}
            onRestoreCanvas={onRestoreCanvas}
            currentCanvasState={currentCanvasState}
            onQuestionDataChange={onQuestionDataChange}
            isSandboxMode={isSandboxMode}
            fontScale={fontScale}
          />
        </div>

        {questionSelected && (
          <>
            {row ? (
              <div className={styles.rowGap} />
            ) : (
              <div
                className={styles.resizeDivider}
                onMouseDown={handleMouseDown}
                role="separator"
                aria-orientation="horizontal"
              />
            )}
            <div
              data-tour="feedback" className={styles.feedbackPanel}
              style={row ? undefined : { height: `${100 - topHeight}%` }}
            >
              <FeedbackTab
                submissionResults={submissionResults}
                masterErrorList={masterErrorList}
                elements={elements}
                setElements={setElements}
                onOpenEditor={onOpenEditor}
                questionSelected={questionSelected}
                questionIndex={questionIndex}
                questionType={questionType}
                isSandboxMode={!isSandboxMode}
                onResubmit={handleResubmit}
                resubmitLine={lastSubmitLine}
                fontScale={fontScale}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
