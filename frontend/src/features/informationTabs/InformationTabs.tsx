import { SubmissionResult, Tab, CanvasElement } from "../shared/types";
import { MasterErrorList } from "../memoryModelEditor/utils/masterErrorList";
import FeedbackTab from "./feedbackTab/FeedbackTab";
import QuestionTab from "./questionTab/QuestionTab";
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
  setSubmissionResults: (results: SubmissionResult | null) => void;
  onClearCanvas: () => void;
  onRestoreCanvas: (elements: any[], ids: number[], classes: string[]) => void;
  currentCanvasState: { elements: any[]; ids: number[]; classes: string[] };
  masterErrorList: MasterErrorList;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  onOpenEditor: (element: CanvasElement) => void;
  isSandboxMode: boolean;
  onQuestionDataChange?: (data: any) => void;
}

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
  masterErrorList,
  elements,
  setElements,
  onOpenEditor,
  isSandboxMode,
  onQuestionDataChange,
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

  const handleSubmit = async () => {
    const success = await onSubmit();
    if (success) {
      setActive("feedback");
    }
    return success;
  };

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
              onSubmit={handleSubmit}
              setSubmissionResults={setSubmissionResults}
              onClearCanvas={onClearCanvas}
              onRestoreCanvas={onRestoreCanvas}
              currentCanvasState={currentCanvasState}
              onQuestionDataChange={onQuestionDataChange}
            />
          </div>

          <div
            className={activeTab === "feedback" ? "" : styles.hidden}
            role="tabpanel"
            aria-hidden={activeTab !== "feedback"}
          >
            <FeedbackTab
              submissionResults={submissionResults}
              masterErrorList={masterErrorList}
              elements={elements}
              setElements={setElements}
              onOpenEditor={onOpenEditor}
              questionSelected={questionSelected}
              questionIndex={questionIndex}
              questionType={questionType}
              isSandboxMode={isSandboxMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
