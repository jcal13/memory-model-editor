import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { fetchQuestionCount, fetchQuestion } from "./FetchQuestionService";
import QuestionSelector from "./components/QuestionSelector";
import CodeBlock from "./components/CodeBlock";
import styles from "./styles/QuestionTab.module.css";
import "prismjs/themes/prism-tomorrow.css";

type View = "root" | "loading" | "test" | "list" | "question" | "practice";
type QType = "test" | "practice";

export default function QuestionTab({
  questionIndex,
  setQuestionIndex,
  questionType,
  setQuestionType,
}: {
  questionIndex: number | null;
  setQuestionIndex: (i: number | null) => void;
  questionType: "test" | "practice" | null;
  setQuestionType: (t: "test" | "practice" | null) => void;
}) {
  const [view, setView] = useState<View>("root");
  const [questionCount, setQuestionCount] = useState(0);
  const [questionData, setQuestionData] = useState<any>(null);

  const loadQuestions = async (qt: QType) => {
    setView("loading");
    const count = await fetchQuestionCount(qt);
    setQuestionCount(count);
    setQuestionType(qt);
    setView("list");
  };

  const loadSingleQuestion = async (id: number) => {
    if (!questionType) return;
    setView("loading");
    try {
      const data = await fetchQuestion(id, questionType);
      setQuestionIndex(id);
      setQuestionData(data);
      setView("question");
    } catch (err) {
      console.error(err);
      setView("list");
    }
  };

  let heading = "Questions";
  if (view === "question" && questionIndex !== null) {
    heading = `Question ${questionIndex}`;
  } else if (view === "list" && questionType === "test") {
    heading = "Test Questions";
  } else if (view === "list" && questionType === "practice") {
    heading = "Practice Questions";
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{heading}</h1>

      {view === "root" && (
        <div className={styles.selectors}>
          <QuestionSelector
            text="Practice Questions"
            onClick={() => loadQuestions("practice")}
          />
          <QuestionSelector
            text="Test Questions"
            onClick={() => loadQuestions("test")}
          />
        </div>
      )}

      {view === "loading" && <p className={styles.loading}>Loading…</p>}

      {view === "list" && (
        <>
          <div className={styles.backRow}>
            <button
              type="button"
              onClick={() => setView("root")}
              className={styles.backBtn}
            >
              ← Back
            </button>
          </div>

          <div className={styles.scroller}>
            <div className={styles.selectors}>
              {Array.from({ length: questionCount }, (_, i) => (
                <QuestionSelector
                  key={i + 1}
                  text={`Question ${i + 1}`}
                  onClick={() => loadSingleQuestion(i + 1)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {view === "question" && questionData && (
        <>
          <div className={styles.backRow}>
            <button onClick={() => setView("list")} className={styles.backBtn}>
              ← Back
            </button>
          </div>

          <div className={styles.questionArea}>
            <div className={styles.questionText}>
              <ReactMarkdown>{questionData.question}</ReactMarkdown>
            </div>

            <CodeBlock code={questionData.code.join("\n")} language="python" />
          </div>
        </>
      )}
    </div>
  );
}
