import { CanvasElement, SubmissionResult, Tab } from "../../shared/types";
import { submitCanvas } from "../../validationServices/questionValidationService";

interface UseCanvasSubmissionParams {
  selectedQuestionIndex: number | null;
  selectedQuestionType: "test" | "practice" | null;
  elements: CanvasElement[];
  setSubmissionResults: (results: SubmissionResult) => void;
  setActiveInfoTab: (tab: Tab) => void;
}

interface UseCanvasSubmissionReturn {
  handleCanvasSubmit: () => Promise<void>;
}

/**
 * Hook that provides canvas submission functionality
 * @param params - Configuration for canvas submission
 * @returns Object with submission handler
 */
export function useCanvasSubmission({
  selectedQuestionIndex,
  selectedQuestionType,
  elements,
  setSubmissionResults,
  setActiveInfoTab,
}: UseCanvasSubmissionParams): UseCanvasSubmissionReturn {
  const handleCanvasSubmit = async () => {
    // Validate required parameters
    if (selectedQuestionIndex === null || selectedQuestionType === null) {
      console.warn("Cannot submit: question index or type is null");
      setSubmissionResults(null);
      setActiveInfoTab("feedback");
      return;
    }

    // Filter out invalidated elements
    const validElements = elements.filter((element) => !element.invalidated);

    // Basic validation
    if (validElements.length === 0) {
      console.warn("No valid elements to submit");
      setSubmissionResults(null);
      setActiveInfoTab("feedback");
      return;
    }

    try {
      const result = await submitCanvas(
        validElements,
        selectedQuestionIndex,
        selectedQuestionType
      );

      if (result !== undefined) {
        setSubmissionResults(result);
      } else {
        console.warn("Submission returned undefined result");
        setSubmissionResults(null);
      }

      setActiveInfoTab("feedback");
    } catch (error) {
      console.error("Canvas submission failed:", error);
      setSubmissionResults(null);
      setActiveInfoTab("feedback");
    }
  };

  return { handleCanvasSubmit };
}
