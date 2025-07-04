import styles from "./styles/FeedbackTab.module.css";
import { SubmissionResult } from "../../../shared/types";

interface Props {
  submissionResults: SubmissionResult | null;
}

export default function FeedbackTab({ submissionResults }: Props) {
  if (!submissionResults) {
    return <div className={styles.content}>No submission yet.</div>;
  }

  if (submissionResults.correct) {
    return (
      <div className={`${styles.content} ${styles.correct}`}>
        Correct!
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <p className={styles.incorrect}>Incorrect – see errors below:</p>
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
