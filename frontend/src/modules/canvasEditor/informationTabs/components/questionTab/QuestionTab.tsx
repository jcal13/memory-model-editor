import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { fetchTestQuestionCount } from "./FetchQuestionService";
import QuestionSelector from "./components/QuestionSelector";
import CodeBlock from "./components/CodeBlock";
import styles from "./styles/QuestionTab.module.css";
import "prismjs/themes/prism-tomorrow.css";

type View = "root" | "loading" | "test" | "question";

export default function QuestionTab() {
  const [view, setView] = useState<View>("root");
  const [testCount, setTestCount] = useState(0);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<any>(null);

  const loadTestQuestions = async () => {
    setView("loading");
    const count = await fetchTestQuestionCount();
    setTestCount(count);
    setView("test");
  };

  const loadSingleQuestion = async (id: number) => {
    setView("loading");
    const res = await fetch(
      `http://localhost:3001/questions/testquestions/${id}`
    );
    const data = await res.json();
    setCurrentId(id);
    setQuestionData(data);
    setView("question");
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>
        {view === "test"
          ? "Test Questions"
          : view === "question"
          ? `Question ${currentId}`
          : "Questions"}
      </h1>

      {view === "root" && (
        <div className={styles.selectors}>
          <QuestionSelector text="Practice Questions" />
          <QuestionSelector text="Test Questions" onClick={loadTestQuestions} />
        </div>
      )}

      {view === "loading" && <p className={styles.loading}>Loading…</p>}

      {view === "test" && (
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

          <div className={styles.selectors}>
            {Array.from({ length: testCount }, (_, i) => (
              <QuestionSelector
                key={i + 1}
                text={`Question ${i + 1}`}
                onClick={() => loadSingleQuestion(i + 1)}
              />
            ))}
          </div>
        </>
      )}

      {view === "question" && questionData && (
        <>
          <div className={styles.backRow}>
            <button onClick={() => setView("test")} className={styles.backBtn}>
              ← Back
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
