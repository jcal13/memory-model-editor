import express from "express";
import { validateAnswerDetailed } from "./validateAnswer";

const router = express.Router();

router.post("/submit", (req, res) => {
  const canvasJSON = req.body;
  console.log("Canvas data:", canvasJSON);

  const result = validateAnswerDetailed(canvasJSON);
  console.log("User submission is", result.correct ? "Correct" : "Incorrect");
  if (!result.correct) {
    console.log("Errors:");
    result.errors.forEach((err) => console.log(" -", err));
  }

  res.status(200).json(result);
});

export default router;
