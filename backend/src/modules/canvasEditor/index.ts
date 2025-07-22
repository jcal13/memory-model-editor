import express from "express";
import validateAnswer from "./validateAnswer";

const router = express.Router();

router.post("/submit", (req, res) => {
  const { model, questionIndex, questionType } = req.body;
  console.log("Canvas data:", model);

  const result = validateAnswer(model, questionIndex, questionType);
  console.log("User submission is", result.correct ? "Correct" : "Incorrect");
  if (!result.correct) {
    console.log("Errors:");
    result.errors.forEach((err: string) => console.log(" -", err));
  }

  res.status(200).json(result);
});

export default router;
