import {
  SubmissionResult,
  CanvasElement,
  ErrorSource,
} from "../../shared/types";
import {
  MasterErrorList,
  flattenErrorList,
} from "../../memoryModelEditor/utils/masterErrorList";
import ErrorListDisplay from "../components/ErrorListDisplay";
import styles from "./FeedbackTab.module.css";

interface FeedbackTabProps {
  submissionResults: SubmissionResult | null;
  questionSelected: boolean;
  questionIndex: number | null;
  questionType: "test" | "practice" | "prep" | null;
  masterErrorList: MasterErrorList;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  onOpenEditor: (element: CanvasElement) => void;
  isSandboxMode: boolean;
  onResubmit: () => Promise<boolean>;
  resubmitLine?: { line: number; iteration?: number } | null;
  fontScale?: number;
}

export default function FeedbackTab({
  submissionResults,
  questionSelected,
  questionIndex,
  questionType,
  masterErrorList,
  elements,
  setElements,
  onOpenEditor,
  isSandboxMode,
  onResubmit,
  resubmitLine,
  fontScale = 1,
}: FeedbackTabProps) {
  const renderTitle = () => {
    let questionName = "";
    if (questionType && questionIndex !== null) {
      const typeLabel = questionType === "test" ? "Test" : questionType === "prep" ? "CSC148 Prep" : "Practice";
      questionName = ` - ${typeLabel} Question ${questionIndex}`;
    }

    return <h1 className={styles.title}>Feedback{questionName}</h1>;
  };

  const renderEmptyState = (
    icon: string,
    message: string,
    subtext?: string
  ) => (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{icon}</div>
      <p className={styles.emptyMessage}>{message}</p>
      {subtext && <p className={styles.emptySubtext}>{subtext}</p>}
    </div>
  );

  if (!questionSelected) {
    return (
      <>
        {renderTitle()}
        <div className={styles.content}>
          {renderEmptyState(
            "📋",
            "No question selected",
            "Select a question to get started"
          )}
        </div>
      </>
    );
  }

  if (!submissionResults) {
    return (
      <>
        {renderTitle()}
        <div className={styles.content}>
          {renderEmptyState(
            "📝",
            "No submission yet",
            "Submit your answer to see feedback"
          )}
        </div>
      </>
    );
  }

  const scaleStyle = { '--font-scale': fontScale } as React.CSSProperties;

  if (submissionResults.correct) {
    return (
      <>
        {renderTitle()}
        <div className={styles.content} style={scaleStyle}>
          <div className={styles.resultBanner + " " + styles.correct}>
            <svg
              className={styles.resultIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className={styles.resultText}>
              {resubmitLine != null
                ? resubmitLine.iteration !== undefined
                  ? `Your answer is correct up to line ${resubmitLine.line} (iter ${resubmitLine.iteration})!`
                  : `Your answer is correct up to line ${resubmitLine.line}!`
                : "Your answer is correct!"}
            </span>
          </div>
        </div>
      </>
    );
  }

  const allErrors = flattenErrorList(masterErrorList);
  const feedbackErrors = allErrors.filter(
    (item) => item.error.source === ErrorSource.FEEDBACK
  );

  const uniqueFeedbackErrors = feedbackErrors.filter((item, index, self) => {
    return self.findIndex((other) => other.error === item.error) === index;
  });

  return (
    <>
      {renderTitle()}
      <div style={scaleStyle}>
        <ErrorListDisplay
          errors={uniqueFeedbackErrors}
          elements={elements}
          setElements={setElements}
          onOpenEditor={onOpenEditor}
          showTitle={false}
          isSandboxMode={isSandboxMode}
        />
        <div className={styles.resubmitRow}>
          <button
            type="button"
            className={styles.resubmitButton}
            onClick={onResubmit}
          >
            {resubmitLine != null
              ? resubmitLine.iteration !== undefined
                ? `Resubmit at line ${resubmitLine.line} (iter ${resubmitLine.iteration})`
                : `Resubmit at line ${resubmitLine.line}`
              : "Resubmit"}
          </button>
        </div>
      </div>
    </>
  );
}
