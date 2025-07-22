import axios from "axios";

const API_DEV_URL = "http://localhost:3001";

export async function fetchTestQuestionCount(): Promise<number> {
  const res = await axios.post(`${API_DEV_URL}/questions/testquestions`);
  return res.data.count;
}

export async function fetchTestQuestion(id: number) {
  const res = await axios.get(`${API_DEV_URL}/questions/testquestions/${id}`);
  return res.data;
}
