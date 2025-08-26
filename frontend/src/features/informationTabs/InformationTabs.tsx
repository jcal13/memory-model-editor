import styles from "./styles/InformationTabs.module.css";
import FeedbackTab from "./feedbackTab/FeedbackTab";
import QuestionTab from "./questionTab/QuestionTab";
import { SubmissionResult } from "../shared/types";
import { Tab } from "../shared/types";

/**
 * InformationTabs renders two pill‑style tabs:
 *   • Feedback – shows submission results or sandbox notice
 *   • Question  – shows the assignment / help text
 *
 * Each tab is its own component so we can grow their UI independently.
 */

export default function InformationTabs({
  submissionResults,
  activeTab,
  setActive,
  questionSelected,
  questionIndex,
  setQuestionIndex,
  questionType,
  setQuestionType,
}: {
  submissionResults: SubmissionResult;
  activeTab: Tab;
  setActive: (tab: Tab) => void;
  questionSelected: boolean;
  questionIndex: number | null;
  setQuestionIndex: (i: number | null) => void;
  questionType: "test" | "practice" | null;
  setQuestionType: (t: "test" | "practice" | null) => void;
}) {
  const renderTabButton = (tab: Tab, label: string) => (
    <button
      type="button"
      className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ""}`}
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
          <div className={activeTab === "question" ? "" : styles.hidden}>
            <QuestionTab
              questionIndex={questionIndex}
              setQuestionIndex={setQuestionIndex}
              questionType={questionType}
              setQuestionType={setQuestionType}
            />
          </div>

          <div className={activeTab === "feedback" ? "" : styles.hidden}>
            <FeedbackTab
              submissionResults={submissionResults}
              questionSelected={questionSelected}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
