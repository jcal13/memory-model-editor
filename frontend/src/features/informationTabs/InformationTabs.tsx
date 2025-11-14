import { SubmissionResult, Tab, CanvasElement } from "../shared/types";
import { MasterErrorList } from "../memoryModelEditor/utils/masterErrorList";
import FeedbackTab from "./feedbackTab/FeedbackTab";
import QuestionTab from "./questionTab/QuestionTab";
import ErrorsTab from "./errorsTab/ErrorsTab";
import styles from "./InformationTabs.module.css";

interface InformationTabsProps {
  submissionResults: SubmissionResult | null;
  activeTab: Tab;
  setActive: (tab: Tab) => void;
  questionSelected: boolean;
  questionIndex: number | null;
  setQuestionIndex: (index: number | null) => void;
  questionType: "test" | "practice" | null;
  setQuestionType: (type: "test" | "practice" | null) => void;
  onSubmit: () => Promise<boolean>;
  masterErrorList: MasterErrorList;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  onOpenEditor: (element: CanvasElement) => void;
}

/**
 * InformationTabs renders three pill-style tabs:
 *   • Feedback — shows submission results or sandbox notice
 *   • Question — shows the assignment / help text
 *   • Errors — shows validation errors from the canvas
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
  masterErrorList,
  elements,
  setElements,
  onOpenEditor,
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
          {renderTabButton("errors", "Errors")}
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

          <div
            className={activeTab === "errors" ? "" : styles.hidden}
            role="tabpanel"
            aria-hidden={activeTab !== "errors"}
          >
            <ErrorsTab 
              masterErrorList={masterErrorList} 
              elements={elements}
              setElements={setElements}
              onOpenEditor={onOpenEditor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
