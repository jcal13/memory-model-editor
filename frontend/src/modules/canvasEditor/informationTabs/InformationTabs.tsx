import { useState } from "react";
import styles from "./styles/InformationTabs.module.css";
import FeedbackTab from "./components/feedbackTab/FeedbackTab";
import QuestionTab from "./components/questionTab/QuestionTab";
import { SubmissionResult } from "../shared/types";

/**
 * InformationTabs renders two pill‑style tabs:
 *   • Feedback – shows submission results or sandbox notice
 *   • Question  – shows the assignment / help text
 *
 * Each tab is its own component so we can grow their UI independently.
 */

type Tab = "feedback" | "question";

export default function InformationTabs({
  submissionResults,
}: {
  submissionResults: SubmissionResult;
}) {
  const [active, setActive] = useState<Tab>("question");

  const renderTabButton = (tab: Tab, label: string) => (
    <button
      type="button"
      className={`${styles.tabBtn} ${active === tab ? styles.active : ""}`}
      onClick={() => setActive(tab)}
    >
      {label}
    </button>
  );

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        <div className={styles.tabHeaders}>
            {renderTabButton("question", "Question")}
            {renderTabButton("feedback", "Feedback")}
        </div>

        <div className={styles.tabBody}>
          {active === "feedback" ? (
            <FeedbackTab submissionResults={submissionResults}/>
          ) : (
            <QuestionTab />
          )}
        </div>
      </div>
    </div>
  );
}
