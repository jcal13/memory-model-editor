import express from "express";
import testQuestions from "./questions/testQuestions";

const router = express.Router();

router.post("/testquestions", (req, res) => {
  const count: number = Object.keys(testQuestions).length;
  res.status(200).json({ count });
});

router.get("/testquestions/:id", (req: any, res: any) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id) || !(id in testQuestions)) {
    return res.status(404).json({ error: "Question not found" });
  }

  const question = testQuestions[id];
  return res.status(200).json(question);
});

export default router;
