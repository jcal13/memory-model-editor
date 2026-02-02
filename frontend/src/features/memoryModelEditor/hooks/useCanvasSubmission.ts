import { useCallback, useEffect, useRef } from "react";
import { CanvasElement, SubmissionResult, Tab } from "../../shared/types";
import { submitCanvas } from "../../validationServices/questionValidationService";
import { applyFeedbackErrors, clearFeedbackErrors } from "../utils/feedbackErrorMapper";

interface UseCanvasSubmissionParams {
  selectedQuestionIndex: number | null;
  selectedQuestionType: "test" | "practice" | "prep" | null;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  setSubmissionResults: (results: SubmissionResult | null) => void;
  setActiveInfoTab: (tab: Tab) => void;
}

interface UseCanvasSubmissionReturn {
  handleCanvasSubmit: () => Promise<boolean>;
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
  setElements,
  setSubmissionResults,
  setActiveInfoTab,
}: UseCanvasSubmissionParams): UseCanvasSubmissionReturn {
  const idxRef = useRef(selectedQuestionIndex);
  const typeRef = useRef(selectedQuestionType);
  const elsRef = useRef(elements);
  const setElsRef = useRef(setElements);
  const setResultsRef = useRef(setSubmissionResults);
  const setTabRef = useRef(setActiveInfoTab);

  useEffect(() => {
    idxRef.current = selectedQuestionIndex;
  }, [selectedQuestionIndex]);
  useEffect(() => {
    typeRef.current = selectedQuestionType;
  }, [selectedQuestionType]);
  useEffect(() => {
    elsRef.current = elements;
  }, [elements]);
  useEffect(() => {
    setElsRef.current = setElements;
  }, [setElements]);
  useEffect(() => {
    setResultsRef.current = setSubmissionResults;
  }, [setSubmissionResults]);
  useEffect(() => {
    setTabRef.current = setActiveInfoTab;
  }, [setActiveInfoTab]);

  const handleCanvasSubmit = useCallback(async (): Promise<boolean> => {
    const index = idxRef.current;
    const qtype = typeRef.current;
    const els = elsRef.current;

    if (index === null || qtype === null) {
      console.warn("Cannot submit: question index or type is null");
      setResultsRef.current(null);
      setTabRef.current("feedback");
      return false;
    }

    // Prepare a clean copy for submission without mutating displayed elements yet
    const clearedElements = clearFeedbackErrors(els);
    const validElements = clearedElements.filter((el) => !el.invalidated);

    if (validElements.length === 0) {
      console.warn("No valid elements to submit");
      setResultsRef.current(null);
      setTabRef.current("feedback");
      return false;
    }

    try {
      const result = await submitCanvas(validElements, index, qtype);

      if (result !== undefined && result !== null) {
        console.log('[useCanvasSubmission] Submission result:', result);
        console.log('[useCanvasSubmission] Feedback errors count:', result.errors?.length || 0);

        // Apply new feedback errors (or just clear old ones) and update results together
        if (result.errors && result.errors.length > 0) {
          console.log('[useCanvasSubmission] Applying feedback errors:', result.errors);
          const elementsWithFeedback = applyFeedbackErrors(clearedElements, result.errors);
          console.log('[useCanvasSubmission] Elements with feedback:', elementsWithFeedback.filter(el => el.errors && el.errors.length > 0));
          setElsRef.current(elementsWithFeedback);
        } else {
          setElsRef.current(clearedElements);
        }

        setResultsRef.current(result);

        // Determine if submission was correct based on result
        const isCorrect = determineIfCorrect(result);

        // Switch to feedback tab to show submission results
        setTabRef.current("feedback");

        return isCorrect;
      } else {
        console.warn("Submission returned undefined result");
        setResultsRef.current(null);
        setTabRef.current("feedback");
        return false;
      }
    } catch (error) {
      console.error("Canvas submission failed:", error);
      setResultsRef.current(null);
      setTabRef.current("feedback");
      return false;
    }
  }, []);

  return { handleCanvasSubmit };
}

/**
 * Determines if the submission was correct based on SubmissionResult
 */
function determineIfCorrect(result: SubmissionResult): boolean {
  return result?.correct ?? false;
}
