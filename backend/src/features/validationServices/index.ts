import express from "express";
import validateAnswer, { validateAnswerAtLine } from "./validateAnswer";

const router = express.Router();

router.post("/submit", async (req, res) => {
  const { model, questionIndex, questionType } = req.body;
  console.log("Canvas data:", model);

  const result = await validateAnswer(model, questionIndex, questionType);
  console.log("User submission is", result.correct ? "Correct" : "Incorrect");
  if (!result.correct) {
    console.log("Errors:");
    result.errors.forEach((err) => console.log(" -", err.message));
  }

  res.status(200).json(result);
});

router.post("/submitAtLine", async (req, res) => {
  const { model, questionIndex, questionType, lineNumber, iterationNumber } = req.body;
  const iterLabel = iterationNumber !== undefined ? `, iter ${iterationNumber}` : "";
  console.log(`Canvas data (check at line ${lineNumber}${iterLabel}):`, model);

  const result = await validateAnswerAtLine(model, questionIndex, questionType, lineNumber, iterationNumber);
  console.log(`Line ${lineNumber}${iterLabel} check is`, result.correct ? "Correct" : "Incorrect");
  if (!result.correct) {
    console.log("Errors:");
    result.errors.forEach((err) => console.log(" -", err.message));
  }

  res.status(200).json(result);
});

export default router;
