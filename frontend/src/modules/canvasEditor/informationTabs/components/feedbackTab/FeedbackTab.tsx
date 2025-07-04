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
          <p>
            Your answer is: <span className={styles.correct}>correct!</span>
          </p>
        </div>
      </>
    );
  }

  return (
    <div className={styles.content}>
      <h1 className={styles.title}>Feedback</h1>
      <p>
        Your answer is: <span className={styles.incorrect}>incorrect</span>
      </p>
      <p>
        <strong>Errors:</strong>
      </p>
      <ul className={styles.errorList}>
        {submissionResults.errors.map((err, i) => (
          <li key={i} className={styles.errorItem}>
            {err}
          </li>
        ))}
      </ul>
    </div>
  );
}
