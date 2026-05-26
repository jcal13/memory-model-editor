import { useCallback, useEffect, useRef } from "react";
import { CanvasElement, SubmissionResult } from "../../shared/types";
import { submitCanvas, submitCanvasAtLine } from "../../validationServices/questionValidationService";
import { applyFeedbackErrors, clearFeedbackErrors } from "../utils/feedbackErrorMapper";

interface UseCanvasSubmissionParams {
  selectedQuestionIndex: number | null;
  selectedQuestionType: "test" | "practice" | "prep" | "experiment" | null;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  setSubmissionResults: (results: SubmissionResult | null) => void;
}

interface UseCanvasSubmissionReturn {
  handleCanvasSubmit: () => Promise<boolean>;
  handleCanvasSubmitAtLine: (lineNumber: number, iterationNumber?: number) => Promise<boolean>;
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
}: UseCanvasSubmissionParams): UseCanvasSubmissionReturn {
  const idxRef = useRef(selectedQuestionIndex);
  const typeRef = useRef(selectedQuestionType);
  const elsRef = useRef(elements);
  const setElsRef = useRef(setElements);
  const setResultsRef = useRef(setSubmissionResults);

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

  const handleCanvasSubmit = useCallback(async (): Promise<boolean> => {
    const index = idxRef.current;
    const qtype = typeRef.current;
    const els = elsRef.current;

    if (index === null || qtype === null) {
      console.warn("Cannot submit: question index or type is null");
      setResultsRef.current(null);
      return false;
    }

    // Prepare a clean copy for submission without mutating displayed elements yet
    const clearedElements = clearFeedbackErrors(els);
    const validElements = clearedElements.filter((el) => !el.invalidated);

    if (validElements.length === 0) {
      console.warn("No valid elements to submit");
      setResultsRef.current(null);
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

        return isCorrect;
      } else {
        console.warn("Submission returned undefined result");
        setResultsRef.current(null);
        return false;
      }
    } catch (error) {
      console.error("Canvas submission failed:", error);
      setResultsRef.current(null);
      return false;
    }
  }, []);

  const handleCanvasSubmitAtLine = useCallback(async (lineNumber: number, iterationNumber?: number): Promise<boolean> => {
    const index = idxRef.current;
    const qtype = typeRef.current;
    const els = elsRef.current;

    if (index === null || qtype === null) {
      console.warn("Cannot submit at line: question index or type is null");
      setResultsRef.current(null);
      return false;
    }

    const clearedElements = clearFeedbackErrors(els);
    const validElements = clearedElements.filter((el) => !el.invalidated);

    if (validElements.length === 0) {
      console.warn("No valid elements to submit at line");
      setResultsRef.current(null);
      return false;
    }

    try {
      const result = await submitCanvasAtLine(validElements, index, qtype, lineNumber, iterationNumber);

      if (result !== undefined && result !== null) {
        console.log('[useCanvasSubmission] submitAtLine result:', result);

        if (result.errors && result.errors.length > 0) {
          const elementsWithFeedback = applyFeedbackErrors(clearedElements, result.errors);
          setElsRef.current(elementsWithFeedback);
        } else {
          setElsRef.current(clearedElements);
        }

        setResultsRef.current(result);

        const isCorrect = determineIfCorrect(result);
        return isCorrect;
      } else {
        console.warn("submitAtLine returned undefined result");
        setResultsRef.current(null);
        return false;
      }
    } catch (error) {
      console.error("Canvas submitAtLine failed:", error);
      setResultsRef.current(null);
      return false;
    }
  }, []);

  return { handleCanvasSubmit, handleCanvasSubmitAtLine };
}

/**
 * Determines if the submission was correct based on SubmissionResult
 */
function determineIfCorrect(result: SubmissionResult): boolean {
  return result?.correct ?? false;
}
