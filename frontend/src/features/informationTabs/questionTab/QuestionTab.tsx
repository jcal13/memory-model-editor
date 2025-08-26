import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { fetchQuestionCount, fetchQuestion } from "./FetchQuestionService";
import QuestionSelector from "./components/QuestionSelector";
import CodeBlock from "./components/CodeBlock";
import styles from "./QuestionTab.module.css";
import "prismjs/themes/prism-tomorrow.css";

type View = "root" | "loading" | "test" | "list" | "question" | "practice";
type QType = "test" | "practice";

const UI_LS_KEY = "uiState";

function loadSavedQuestionView(): View {
  try {
    const raw = localStorage.getItem(UI_LS_KEY);
    if (!raw) return "root";
    const parsed = JSON.parse(raw) ?? {};
    const v = parsed?.questionView as View | undefined;
    if (
      !v ||
      !["root", "loading", "test", "list", "question", "practice"].includes(v)
    ) {
      return "root";
    }
    return v === "loading" ? "root" : v;
  } catch {
    return "root";
  }
}

function persistQuestionView(view: View) {
  try {
    const raw = localStorage.getItem(UI_LS_KEY);
    const parsed = raw ? JSON.parse(raw) ?? {} : {};
    parsed.questionView = view;
    localStorage.setItem(UI_LS_KEY, JSON.stringify(parsed));
  } catch {}
}

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
  const [view, setView] = useState<View>(() => loadSavedQuestionView());
  const [questionCount, setQuestionCount] = useState(0);
  const [questionData, setQuestionData] = useState<any>(null);

  useEffect(() => {
    persistQuestionView(view);
  }, [view]);

  const loadQuestions = async (qt: QType) => {
    setView("loading");
    try {
      const count = await fetchQuestionCount(qt);
      setQuestionCount(count);
      setQuestionType(qt);
      setQuestionIndex(null);
      setView("list");
    } catch (e) {
      console.error(e);
      setView("root");
    }
  };

  const loadSingleQuestion = async (id: number) => {
    const qt = questionType;
    if (!qt) {
      setView("root");
      return;
    }
    setView("loading");
    try {
      const data = await fetchQuestion(id, qt);
      setQuestionIndex(id);
      setQuestionData(data);
      setView("question");
    } catch (err) {
      console.error(err);
      setView("list");
    }
  };
  const hydratedList = useRef(false);
  useEffect(() => {
    if (view === "list" && questionType && !hydratedList.current) {
      hydratedList.current = true;
      // don't flip to "loading" here to avoid a flicker; just hydrate silently
      fetchQuestionCount(questionType)
        .then((count) => setQuestionCount(count))
        .catch((e) => {
          console.error(e);
          setView("root");
        });
    }
  }, [view, questionType]);

  const hydratedQuestion = useRef(false);
  useEffect(() => {
    if (
      view === "question" &&
      questionType &&
      questionIndex != null &&
      !questionData &&
      !hydratedQuestion.current
    ) {
      hydratedQuestion.current = true;
      (async () => {
        try {
          const data = await fetchQuestion(questionIndex, questionType);
          setQuestionData(data);
        } catch (e) {
          console.error(e);
          setView("list");
        }
      })();
    }
  }, [view, questionType, questionIndex, questionData]);

  useEffect(() => {
    if (view === "list" && !questionType) setView("root");
    if (view === "question" && (!questionType || questionIndex == null))
      setView("root");
  }, [view, questionType, questionIndex]);

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
              onClick={() => {
                setQuestionIndex(null);
                setView("root");
              }}
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
            <button
              onClick={async () => {
                // ensure list is hydrated if we came straight from a cold resume
                if ((questionCount ?? 0) === 0 && questionType) {
                  try {
                    const count = await fetchQuestionCount(questionType);
                    setQuestionCount(count);
                  } catch (e) {
                    console.error(e);
                  }
                }
                setQuestionIndex(null);
                setView("list");
              }}
              className={styles.backBtn}
            >
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
