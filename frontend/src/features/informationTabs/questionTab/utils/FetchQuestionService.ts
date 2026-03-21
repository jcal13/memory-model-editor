import axios from "axios";

// Configuration
const API_URL =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:3001";

/**
 * Fetches a specific question by ID and type
 * @param id - Question ID
 * @param type - Question type ("test" or "practice")
 * @returns Promise with question data
 */
export async function fetchQuestion<T = any>(
  id: number,
  type: "test" | "practice" | "prep" | "experiment",
): Promise<T> {
  try {
    const response = await axios.get(
      `${API_URL}/questions/${type}questions/${id}`,
    );
    return response.data as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch question: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Fetches the total count of questions for a given type
 * @param type - Question type ("test" or "practice")
 * @returns Promise with question count
 */
export async function fetchQuestionCount(
  type: "test" | "practice" | "prep" | "experiment",
): Promise<number> {
  try {
    const url = `${API_URL}/questions/${type}questions`;
    const response = await axios.post(url);
    return response.data.count as number;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch question count: ${error.message}`);
    }
    throw error;
  }
}
