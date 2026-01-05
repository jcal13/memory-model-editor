import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

interface Question {
  id: number;
  question: string;
  code: string[];
  answer: any;
  description: string | null;
}

async function createDatabaseIfNotExists() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const dbUrl = new URL(
    connectionString.replace("postgresql://", "postgres://")
  );
  const targetDb = dbUrl.pathname.slice(1);

  dbUrl.pathname = "/postgres";
  const adminPool = new Pool({
    connectionString: dbUrl.toString().replace("postgres://", "postgresql://"),
  });

  try {
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );

    if (result.rows.length === 0) {
      console.log(`Database '${targetDb}' does not exist. Creating...`);
      await adminPool.query(`CREATE DATABASE ${targetDb}`);
      console.log(`Database '${targetDb}' created successfully`);
    }
  } catch (error) {
    console.error("ERROR: Failed to create database:", error);
    throw error;
  } finally {
    await adminPool.end();
  }
}

async function createTablesIfNotExist(pool: Pool) {
  console.log("Checking if tables exist...");

  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS practice_questions (
        id BIGSERIAL PRIMARY KEY,
        question TEXT,
        code TEXT[],
        answer JSONB,
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS test_questions (
        id BIGSERIAL PRIMARY KEY,
        question TEXT,
        code TEXT[],
        answer JSONB,
        description TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_practice_questions_id ON practice_questions(id);
    CREATE INDEX IF NOT EXISTS idx_test_questions_id ON test_questions(id);
  `;

  await pool.query(schemaSQL);
  console.log("Tables created or already exist");
}

async function importQuestions() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  await createDatabaseIfNotExists();

  const pool = new Pool({ connectionString });

  try {
    console.log("Reading questions from JSON files...");

    await createTablesIfNotExist(pool);

    const practiceQuestionsPath = path.join(
      __dirname,
      "../database/practiceQuestions.json"
    );
    const practiceQuestions: Question[] = JSON.parse(
      fs.readFileSync(practiceQuestionsPath, "utf-8")
    );

    const testQuestionsPath = path.join(
      __dirname,
      "../database/testQuestions.json"
    );
    const testQuestions: Question[] = JSON.parse(
      fs.readFileSync(testQuestionsPath, "utf-8")
    );

    console.log(`Found ${practiceQuestions.length} practice questions`);
    console.log(`Found ${testQuestions.length} test questions`);

    await pool.query("BEGIN");

    console.log("\nClearing existing questions...");
    await pool.query("DELETE FROM practice_questions");
    await pool.query("DELETE FROM test_questions");

    await pool.query("ALTER SEQUENCE practice_questions_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE test_questions_id_seq RESTART WITH 1");

    console.log("Cleared existing questions\n");

    console.log("Importing practice questions...");
    for (const q of practiceQuestions) {
      await pool.query(
        `INSERT INTO practice_questions (question, code, answer, description)
         VALUES ($1, $2, $3, $4)`,
        [q.question, q.code, JSON.stringify(q.answer), q.description]
      );
      console.log(`  Imported practice question ${q.id}`);
    }

    console.log("\nImporting test questions...");
    for (const q of testQuestions) {
      await pool.query(
        `INSERT INTO test_questions (question, code, answer, description)
         VALUES ($1, $2, $3, $4)`,
        [q.question, q.code, JSON.stringify(q.answer), q.description]
      );
      console.log(`  Imported test question ${q.id}`);
    }

    await pool.query("COMMIT");

    console.log("\nSuccessfully imported all questions");

    const practiceCount = await pool.query(
      "SELECT COUNT(*) as count FROM practice_questions"
    );
    const testCount = await pool.query(
      "SELECT COUNT(*) as count FROM test_questions"
    );

    console.log("\nFinal counts:");
    console.log(`  Practice questions: ${practiceCount.rows[0].count}`);
    console.log(`  Test questions: ${testCount.rows[0].count}`);
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("\nERROR: Failed to import questions:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importQuestions();
