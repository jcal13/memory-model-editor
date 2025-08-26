import axios from "axios";

const API_DEV_URL = "http://localhost:3001";

export async function fetchQuestion<T = any>(
  id: number,
  type: "test" | "practice"
): Promise<T> {
  const res = await axios.get(
    `${API_DEV_URL}/questions/${type}questions/${id}`
  );
  return res.data as T;
}

export async function fetchQuestionCount(
  type: "test" | "practice"
): Promise<number> {
  const url = `${API_DEV_URL}/questions/${type}questions`;
  const res = await axios.post(url);
  return res.data.count as number;
}
