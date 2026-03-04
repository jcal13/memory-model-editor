import axios from "axios";
import { CanvasElement } from "../shared/types";
import { buildJSONFromElements } from "./jsonBuilder";

// Configuration
const API_DEV_URL =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:3001";
const SUBMIT_ENDPOINT = "/canvasEditor/submit";
const SUBMIT_AT_LINE_ENDPOINT = "/canvasEditor/submitAtLine";

// Types
export type QuestionType = "test" | "practice" | "prep";

export interface SubmissionPayload {
  model: ReturnType<typeof buildJSONFromElements>;
  questionIndex: number;
  questionType: QuestionType;
}

export interface SubmissionAtLinePayload extends SubmissionPayload {
  lineNumber: number;
  iterationNumber?: number;
}

/**
 * Submits canvas elements for validation
 * @param elements - Array of canvas elements to validate
 * @param questionIndex - Index of the current question
 * @param questionType - Type of question ("test" or "practice")
 * @returns Promise with validation response
 */
export async function submitCanvas(
  elements: CanvasElement[],
  questionIndex: number,
  questionType: QuestionType,
) {
  try {
    const payload: SubmissionPayload = {
      model: buildJSONFromElements(elements),
      questionIndex,
      questionType,
    };

    const response = await axios.post(
      `${API_DEV_URL}${SUBMIT_ENDPOINT}`,
      payload,
    );

    console.log("[questionValidationService] Backend response:", response.data);
    console.log(
      "[questionValidationService] Response errors:",
      response.data.errors,
    );

    return response.data;
  } catch (error) {
    // Enhanced error handling
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Submission failed: ${message}`);
    }

    throw new Error(`Unexpected error during submission: ${String(error)}`);
  }
}

/**
 * Submits canvas elements for validation against the authored answer at a specific line
 * @param elements - Array of canvas elements to validate
 * @param questionIndex - Index of the current question
 * @param questionType - Type of question ("test" or "practice")
 * @param lineNumber - The line number to validate against
 * @returns Promise with validation response
 */
export async function submitCanvasAtLine(
  elements: CanvasElement[],
  questionIndex: number,
  questionType: QuestionType,
  lineNumber: number,
  iterationNumber?: number,
) {
  try {
    const payload: SubmissionAtLinePayload = {
      model: buildJSONFromElements(elements),
      questionIndex,
      questionType,
      lineNumber,
      iterationNumber,
    };

    const response = await axios.post(
      `${API_DEV_URL}${SUBMIT_AT_LINE_ENDPOINT}`,
      payload,
    );

    console.log("[questionValidationService] submitAtLine response:", response.data);
    console.log(
      "[questionValidationService] submitAtLine errors:",
      response.data.errors,
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Submission failed: ${message}`);
    }

    throw new Error(`Unexpected error during submission: ${String(error)}`);
  }
}
