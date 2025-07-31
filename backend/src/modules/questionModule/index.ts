import express, { Request, Response } from "express";
import { Pool } from "pg";

const router = express.Router();

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    const cs = process.env.DATABASE_URL;
    if (!cs) throw new Error("DATABASE_URL is not set");

    pool = new Pool({ connectionString: cs });

    try {
      const u = new URL(cs);
      console.log(
        "[DB] host=%s user=%s hasPwd=%s sslmode=%s",
        u.host,
        u.username,
        u.password.length > 0,
        u.searchParams.get("sslmode")
      );
    } catch {}
  }
  return pool!;
}

type QuestionRow = {
  id: number;
  question: string;
  code: string[]; // text[]
  answer: unknown; // jsonb
};

router.post("/testquestions", async (_req: Request, res: Response) => {
  try {
    const { rows } = await getPool().query<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM test_questions"
    );
    res.status(200).json({ count: rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to count test questions" });
  }
});

router.get("/testquestions/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const { rows } = await getPool().query<QuestionRow>(
      "SELECT id, question, code, answer FROM test_questions WHERE id = $1",
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Question not found" });
      return;
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch question" });
  }
});

export default router;
