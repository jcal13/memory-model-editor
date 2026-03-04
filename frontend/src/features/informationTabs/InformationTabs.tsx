import { useEffect, useRef, useState } from "react";
import { SubmissionResult, Tab, CanvasElement } from "../shared/types";
import { MasterErrorList } from "../memoryModelEditor/utils/masterErrorList";
import FeedbackTab from "./feedbackTab/FeedbackTab";
import QuestionTab from "./questionTab/QuestionTab";
import styles from "./InformationTabs.module.css";

interface InformationTabsProps {
  submissionResults: SubmissionResult | null;
  activeTab: Tab;
  setActive: (tab: Tab) => void;
  questionSelected: boolean;
  questionIndex: number | null;
  setQuestionIndex: (index: number | null) => void;
  questionType: "test" | "practice" | "prep" | null;
  setQuestionType: (type: "test" | "practice" | "prep" | null) => void;
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
}

export default function InformationTabs({
  submissionResults,
  activeTab,
  setActive,
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
}: InformationTabsProps) {
  const tabBodyRef = useRef<HTMLDivElement>(null);
  // Track the last submission context so Resubmit repeats the same check
  type LastLineCtx = { line: number; iteration?: number } | null;
  const lastSubmitLineRef = useRef<LastLineCtx>(null);
  const [lastSubmitLine, setLastSubmitLine] = useState<LastLineCtx>(null);

  const saveCurrentScroll = () => {
    if (tabBodyRef.current) {
      setTabScrollPositions((prev) => ({
        ...prev,
        [activeTab]: tabBodyRef.current!.scrollTop,
      }));
    }
  };

  // Restore scroll position when active tab changes or on mount
  useEffect(() => {
    if (tabBodyRef.current) {
      tabBodyRef.current.scrollTop = tabScrollPositions[activeTab];
    }
  }, [activeTab, tabScrollPositions]);

  // Save scroll position on unmount (panel close)
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  useEffect(() => {
    const el = tabBodyRef.current;
    return () => {
      if (el) {
        setTabScrollPositions((prev) => ({
          ...prev,
          [activeTabRef.current]: el.scrollTop,
        }));
      }
    };
  }, [setTabScrollPositions]);

  const renderTabButton = (tab: Tab, label: string) => (
    <button
      key={tab}
      type="button"
      className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ""}`}
      onClick={() => {
        saveCurrentScroll();
        setActive(tab);
      }}
      aria-pressed={activeTab === tab}
    >
      {label}
    </button>
  );

  const handleSubmit = async () => {
    lastSubmitLineRef.current = null;
    setLastSubmitLine(null);
    const success = await onSubmit();
    if (success) {
      saveCurrentScroll();
      setActive("feedback");
    }
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
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        <nav className={styles.tabHeaders} role="tablist">
          {renderTabButton("question", "Question")}
          {renderTabButton("feedback", "Feedback")}
        </nav>

        <div className={styles.tabBody} ref={tabBodyRef}>
          <div
            className={activeTab === "question" ? "" : styles.hidden}
            role="tabpanel"
            aria-hidden={activeTab !== "question"}
          >
            <QuestionTab
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
            />
          </div>

          <div
            className={activeTab === "feedback" ? "" : styles.hidden}
            role="tabpanel"
            aria-hidden={activeTab !== "feedback"}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
