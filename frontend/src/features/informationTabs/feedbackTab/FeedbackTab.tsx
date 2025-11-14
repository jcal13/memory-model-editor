import { SubmissionResult } from "../../shared/types";
import styles from "./FeedbackTab.module.css";

interface FeedbackTabProps {
  submissionResults: SubmissionResult | null;
  questionSelected: boolean;
}

export default function FeedbackTab({
  submissionResults,
  questionSelected,
}: FeedbackTabProps) {
  const renderTitle = () => <h1 className={styles.title}>Feedback</h1>;

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

  // Incorrect answer with errors
  return (
    <div className={styles.content}>
      {renderTitle()}
      <p className={styles.correctnessMessage}>
        Your answer is: <span className={styles.incorrect}>incorrect</span>
      </p>

      <h2 className={styles.errorsHeading}>Errors:</h2>
      <ul className={styles.errorList}>
        {submissionResults.errors.map((error, index) => (
          <li key={index} className={styles.errorItem}>
            <strong>{error.type}</strong>: {error.message}
            {error.elementId !== undefined && (
              <span className={styles.elementId}> (Element ID: {error.elementId})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
