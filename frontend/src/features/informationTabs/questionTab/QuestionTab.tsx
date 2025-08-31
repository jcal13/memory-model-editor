import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  fetchQuestionCount,
  fetchQuestion,
} from "./utils/FetchQuestionService";
import QuestionSelector from "./components/QuestionSelector";
import CodeBlock from "./components/CodeBlock";
import styles from "./QuestionTab.module.css";
import "prismjs/themes/prism-tomorrow.css";

type View = "root" | "loading" | "test" | "list" | "question" | "practice";
type QuestionType = "test" | "practice";

// Constants
const UI_STORAGE_KEY = "uiState";
const VALID_VIEWS: View[] = [
  "root",
  "loading",
  "test",
  "list",
  "question",
  "practice",
];

interface QuestionTabProps {
  questionIndex: number | null;
  setQuestionIndex: (index: number | null) => void;
  questionType: "test" | "practice" | null;
  setQuestionType: (type: "test" | "practice" | null) => void;
}

/**
 * Loads saved question view from localStorage
 */
function loadSavedQuestionView(): View {
  try {
    const rawData = localStorage.getItem(UI_STORAGE_KEY);
    if (!rawData) return "root";

    const parsed = JSON.parse(rawData) ?? {};
    const view = parsed?.questionView as View | undefined;

    if (!view || !VALID_VIEWS.includes(view)) {
      return "root";
    }

    return view === "loading" ? "root" : view;
  } catch {
    return "root";
  }
}

/**
 * Persists question view to localStorage
 */
function persistQuestionView(view: View): void {
  try {
    const rawData = localStorage.getItem(UI_STORAGE_KEY);
    const parsed = rawData ? JSON.parse(rawData) ?? {} : {};
    parsed.questionView = view;
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.warn("Failed to persist question view:", error);
  }
}

export default function QuestionTab({
  questionIndex,
  setQuestionIndex,
  questionType,
  setQuestionType,
}: QuestionTabProps) {
  const [view, setView] = useState<View>(() => loadSavedQuestionView());
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [questionData, setQuestionData] = useState<any>(null);

  // Refs to track hydration state
  const hydratedList = useRef<boolean>(false);
  const hydratedQuestion = useRef<boolean>(false);

  // Persist view changes
  useEffect(() => {
    persistQuestionView(view);
  }, [view]);

  /**
   * Loads questions for a given type
   */
  const loadQuestions = async (questionType: QuestionType): Promise<void> => {
    setView("loading");
    try {
      const count = await fetchQuestionCount(questionType);
      setQuestionCount(count);
      setQuestionType(questionType);
      setQuestionIndex(null);
      setView("list");
    } catch (error) {
      console.error("Failed to load questions:", error);
      setView("root");
    }
  };

  /**
   * Loads a single question by ID
   */
  const loadSingleQuestion = async (id: number): Promise<void> => {
    if (!questionType) {
      setView("root");
      return;
    }

    setView("loading");
    try {
      const data = await fetchQuestion(id, questionType);
      setQuestionIndex(id);
      setQuestionData(data);
      setView("question");
    } catch (error) {
      console.error("Failed to load question:", error);
      setView("list");
    }
  };

  /**
   * Navigates back to list view with proper hydration
   */
  const navigateToList = async (): Promise<void> => {
    // Ensure list is hydrated if we came straight from a cold resume
    if (questionCount === 0 && questionType) {
      try {
        const count = await fetchQuestionCount(questionType);
        setQuestionCount(count);
      } catch (error) {
        console.error("Failed to hydrate question count:", error);
      }
    }
    setQuestionIndex(null);
    setView("list");
  };

  // Hydrate list view
  useEffect(() => {
    if (view === "list" && questionType && !hydratedList.current) {
      hydratedList.current = true;
      fetchQuestionCount(questionType)
        .then((count) => setQuestionCount(count))
        .catch((error) => {
          console.error("Failed to hydrate list:", error);
          setView("root");
        });
    }
  }, [view, questionType]);

  // Hydrate question view
  useEffect(() => {
    if (
      view === "question" &&
      questionType &&
      questionIndex !== null &&
      !questionData &&
      !hydratedQuestion.current
    ) {
      hydratedQuestion.current = true;
      (async () => {
        try {
          const data = await fetchQuestion(questionIndex, questionType);
          setQuestionData(data);
        } catch (error) {
          console.error("Failed to hydrate question:", error);
          setView("list");
        }
      })();
    }
  }, [view, questionType, questionIndex, questionData]);

  // Validate view state
  useEffect(() => {
    if (view === "list" && !questionType) setView("root");
    if (view === "question" && (!questionType || questionIndex === null)) {
      setView("root");
    }
  }, [view, questionType, questionIndex]);

  // Calculate heading
  const getHeading = (): string => {
    if (view === "question" && questionIndex !== null) {
      return `Question ${questionIndex}`;
    }
    if (view === "list" && questionType === "test") {
      return "Test Questions";
    }
    if (view === "list" && questionType === "practice") {
      return "Practice Questions";
    }
    return "Questions";
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{getHeading()}</h1>

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

      {view === "loading" && <p className={styles.loading}>Loading...</p>}

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
              {Array.from({ length: questionCount }, (_, index) => (
                <QuestionSelector
                  key={index + 1}
                  text={`Question ${index + 1}`}
                  onClick={() => loadSingleQuestion(index + 1)}
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
              type="button"
              onClick={navigateToList}
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
