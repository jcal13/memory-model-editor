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
  questionType: "test" | "practice" | null;
  masterErrorList: MasterErrorList;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  onOpenEditor: (element: CanvasElement) => void;
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
}: FeedbackTabProps) {
  const renderTitle = () => {
    // Build question name if available
    let questionName = "";
    if (questionType && questionIndex !== null) {
      const typeLabel = questionType === "test" ? "Test" : "Practice";
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

  // No question selected
  if (!questionSelected) {
    return (
      <>
        {renderTitle()}
        <div className={styles.content}>
          {renderEmptyState(
            "📝",
            "No question selected",
            "Select a question to get started"
          )}
        </div>
      </>
    );
  }

  // No submission yet
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

  // Correct answer
  if (submissionResults.correct) {
    return (
      <>
        {renderTitle()}
        <div className={styles.content}>
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
            <span className={styles.resultText}>Your answer is correct!</span>
          </div>
        </div>
      </>
    );
  }

  // Incorrect answer - show feedback errors using ErrorListDisplay
  // Get all errors and filter for feedback errors only
  const allErrors = flattenErrorList(masterErrorList);
  const feedbackErrors = allErrors.filter(
    (item) => item.error.source === ErrorSource.FEEDBACK
  );

  // Deduplicate errors - same error may be attached to multiple elements for canvas highlighting
  // but should only appear once in the feedback list
  const uniqueFeedbackErrors = feedbackErrors.filter((item, index, self) => {
    // Keep only the first occurrence of each unique error object
    return self.findIndex((other) => other.error === item.error) === index;
  });

  return (
    <>
      {renderTitle()}
      <ErrorListDisplay
        errors={uniqueFeedbackErrors}
        elements={elements}
        setElements={setElements}
        onOpenEditor={onOpenEditor}
        showTitle={false}
        emptyStateMessage="No feedback errors"
        emptyStateSubtext="All feedback has been addressed."
      />
    </>
  );
}
