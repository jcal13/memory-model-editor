import express from "express";

const router = express.Router();

router.post("/submit", (req, res) => {
  console.log("Canvas data:", req.body);
  res.status(200).json({ message: "Canvas JSON received." });
});

export default router;
