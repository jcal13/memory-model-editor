import styles from "./styles/FeedbackTab.module.css";
import { SubmissionResult } from "../../../shared/types";

interface Props {
  submissionResults: SubmissionResult | null;
}

export default function FeedbackTab({ submissionResults }: Props) {
  if (!submissionResults) {
    return (
      <>
        <h1 className={styles.title}>Feedback</h1>
        <div className={styles.content}>No submission yet.</div>
      </>
    );
  }

  if (submissionResults.correct) {
    return (
      <>
        <h1 className={styles.title}>Feedback</h1>
        <div className={styles.content}>
          <p className={styles.correctnessMessage}>
            Your answer is: <span className={styles.correct}>correct!</span>
          </p>
        </div>
      </>
    );
  }

  return (
    <div className={styles.content}>
      <h1 className={styles.title}>Feedback</h1>
      <p className={styles.correctnessMessage}>
        Your answer is: <span className={styles.incorrect}>incorrect</span>
      </p>
      <h2 className={styles.errorsHeading}>Errors:</h2>
      <ul className={styles.errorList}>
        {submissionResults.errors.map((err, i) => {
          const colonIndex = err.indexOf(":");

          if (colonIndex === -1) {
            return (
              <li key={i} className={styles.errorItem}>
                {err}
              </li>
            );
          }

          const before = err.slice(0, colonIndex);
          const after = err.slice(colonIndex + 1);

          return (
            <li key={i} className={styles.errorItem}>
              <strong>{before}</strong>: {after.trim()}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
