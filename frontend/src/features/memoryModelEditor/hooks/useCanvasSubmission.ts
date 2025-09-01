import { useCallback, useEffect, useRef } from "react";
import { CanvasElement, SubmissionResult, Tab } from "../../shared/types";
import { submitCanvas } from "../../validationServices/questionValidationService";

interface UseCanvasSubmissionParams {
  selectedQuestionIndex: number | null;
  selectedQuestionType: "test" | "practice" | null;
  elements: CanvasElement[];
  setSubmissionResults: (results: SubmissionResult | null) => void;
  setActiveInfoTab: (tab: Tab) => void;
}

interface UseCanvasSubmissionReturn {
  handleCanvasSubmit: () => Promise<void>;
}

/**
 * Stable submit handler that always uses the latest values.
 * We keep the function identity stable ([]) and read fresh data via refs,
 * so even if a consumer caches onSubmit, it won't submit stale question info.
 */
export function useCanvasSubmission({
  selectedQuestionIndex,
  selectedQuestionType,
  elements,
  setSubmissionResults,
  setActiveInfoTab,
}: UseCanvasSubmissionParams): UseCanvasSubmissionReturn {
  const idxRef = useRef(selectedQuestionIndex);
  const typeRef = useRef(selectedQuestionType);
  const elsRef = useRef(elements);
  const setResultsRef = useRef(setSubmissionResults);
  const setTabRef = useRef(setActiveInfoTab);

  useEffect(() => { idxRef.current = selectedQuestionIndex; }, [selectedQuestionIndex]);
  useEffect(() => { typeRef.current = selectedQuestionType; }, [selectedQuestionType]);
  useEffect(() => { elsRef.current = elements; }, [elements]);
  useEffect(() => { setResultsRef.current = setSubmissionResults; }, [setSubmissionResults]);
  useEffect(() => { setTabRef.current = setActiveInfoTab; }, [setActiveInfoTab]);

  const handleCanvasSubmit = useCallback(async () => {
    const index = idxRef.current;
    const qtype = typeRef.current;
    const els = elsRef.current;

    if (index === null || qtype === null) {
      console.warn("Cannot submit: question index or type is null");
      setResultsRef.current(null);
      setTabRef.current("feedback");
      return;
    }

    const validElements = els.filter((el) => !el.invalidated);

    if (validElements.length === 0) {
      console.warn("No valid elements to submit");
      setResultsRef.current(null);
      setTabRef.current("feedback");
      return;
    }

    try {
      const result = await submitCanvas(validElements, index, qtype);

      if (result !== undefined) {
        setResultsRef.current(result);
      } else {
        console.warn("Submission returned undefined result");
        setResultsRef.current(null);
      }

      setTabRef.current("feedback");
    } catch (error) {
      console.error("Canvas submission failed:", error);
      setResultsRef.current(null);
      setTabRef.current("feedback");
    }
  }, []);

  return { handleCanvasSubmit };
}
