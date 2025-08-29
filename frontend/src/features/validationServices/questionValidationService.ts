import axios from "axios";
import { CanvasElement } from "../shared/types";
import { buildJSONFromElements } from "./jsonBuilder";

const API_DEV_URL = "http://localhost:3001";

export async function submitCanvas(
  elements: CanvasElement[],
  questionIndex: number,
  questionType: "test" | "practice"
) {
  const payload = {
    model: buildJSONFromElements(elements),
    questionIndex,
    questionType,
  };

  const response = await axios.post(
    `${API_DEV_URL}/canvasEditor/submit`,
    payload
  );
  return response.data;
}
