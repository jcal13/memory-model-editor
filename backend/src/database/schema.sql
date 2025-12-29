-- Practice Questions Table
CREATE TABLE IF NOT EXISTS practice_questions (
    id BIGSERIAL PRIMARY KEY,
    question TEXT,
    code TEXT[],
    answer JSONB,
    description TEXT
);

-- Test Questions Table
CREATE TABLE IF NOT EXISTS test_questions (
    id BIGSERIAL PRIMARY KEY,
    question TEXT,
    code TEXT[],
    answer JSONB,
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_practice_questions_id ON practice_questions(id);
CREATE INDEX IF NOT EXISTS idx_test_questions_id ON test_questions(id);