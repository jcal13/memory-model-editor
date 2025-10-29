import { SubmissionResult, Tab } from "../shared/types";
import FeedbackTab from "./feedbackTab/FeedbackTab";
import QuestionTab from "./questionTab/QuestionTab";
import styles from "./InformationTabs.module.css";

interface InformationTabsProps {
  submissionResults: SubmissionResult;
  activeTab: Tab;
  setActive: (tab: Tab) => void;
  questionSelected: boolean;
  questionIndex: number | null;
  setQuestionIndex: (index: number | null) => void;
  questionType: "test" | "practice" | null;
  setQuestionType: (type: "test" | "practice" | null) => void;
  onSubmit: () => Promise<boolean>;
  setSubmissionResults: (results: SubmissionResult | null) => void;
  onClearCanvas: () => void;
  onRestoreCanvas: (elements: any[], ids: number[], classes: string[]) => void;
  currentCanvasState: { elements: any[]; ids: number[]; classes: string[] };
}

/**
 * InformationTabs renders two pill-style tabs:
 *   • Feedback — shows submission results or sandbox notice
 *   • Question — shows the assignment / help text
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
  onSubmit,
  setSubmissionResults,
  onClearCanvas,
  onRestoreCanvas,
  currentCanvasState,
}: InformationTabsProps) {
  const renderTabButton = (tab: Tab, label: string) => (
    <button
      key={tab}
      type="button"
      className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ""}`}
      onClick={() => setActive(tab)}
      aria-pressed={activeTab === tab}
    >
      {label}
    </button>
  );

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        <nav className={styles.tabHeaders} role="tablist">
          {renderTabButton("question", "Question")}
          {renderTabButton("feedback", "Feedback")}
        </nav>

        <div className={styles.tabBody}>
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
              onSubmit={onSubmit}
              setSubmissionResults={setSubmissionResults}
              onClearCanvas={onClearCanvas}
              onRestoreCanvas={onRestoreCanvas}
              currentCanvasState={currentCanvasState}
            />
          </div>

          <div
            className={activeTab === "feedback" ? "" : styles.hidden}
            role="tabpanel"
            aria-hidden={activeTab !== "feedback"}
          >
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
