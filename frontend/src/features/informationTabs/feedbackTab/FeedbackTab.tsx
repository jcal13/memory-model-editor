import { SubmissionResult, CanvasElement, ErrorSource } from "../../shared/types";
import { MasterErrorList, flattenErrorList } from "../../memoryModelEditor/utils/masterErrorList";
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

  const renderContent = (message: string, className?: string) => (
    <div className={styles.content}>
      <p className={`${styles.correctnessMessage} ${className || ""}`}>
        {message}
      </p>
    </div>
  );

  // No question selected
  if (!questionSelected) {
    return (
      <>
        {renderTitle()}
        {renderContent("No question selected")}
      </>
    );
  }

  // No submission yet
  if (!submissionResults) {
    return (
      <>
        {renderTitle()}
        {renderContent("No submission yet")}
      </>
    );
  }

  // Correct answer
  if (submissionResults.correct) {
    return (
      <>
        {renderTitle()}
        <div className={styles.content}>
          <p className={styles.correctnessMessage}>
            Your answer is: <span className={styles.correct}>correct!</span>
          </p>
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
    return self.findIndex(other => other.error === item.error) === index;
  });

  return (
    <>
      {renderTitle()}
      <div className={styles.content}>
        <p className={styles.correctnessMessage}>
          Your answer is: <span className={styles.incorrect}>incorrect</span>
        </p>
      </div>
      <ErrorListDisplay
        errors={uniqueFeedbackErrors}
        elements={elements}
        setElements={setElements}
        onOpenEditor={onOpenEditor}
        title="Submission Feedback"
        emptyStateMessage="No feedback errors"
        emptyStateSubtext="All feedback has been addressed."
      />
    </>
  );
}
