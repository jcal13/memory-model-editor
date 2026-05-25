# MemoryLab

MemoryLab is a drag-and-drop web application designed for computer science education. It allows students to visualize Python memory models by arranging blocks representing variables, objects, functions, and values on an interactive canvas.

## Table of Contents

- [Key Features](#key-features)
- [Developer Setup (Local)](#developer-setup-local)
- [Production Deployment](#production-deployment)
- [Adding Questions to the Database](#adding-questions-to-the-database)
- [Technical Details: Validation Algorithm](#technical-details-validation-algorithm)
- [Automated Grading with MarkUs](#automated-grading-with-markus)

## Key Features

- **Interactive Canvas**: A Scratch-style interface for building memory diagrams using frames, objects, and values.
- **Practice vs. Test Modes**:
  - **Practice Mode**: A guided environment with structured assistance to assist with model construction.
  - **Test Mode**: A free-form environment with no constraints for independent self-assessment.
- **Question Bank**: Includes built-in exercises drawn from previous first-year computer science courses and tests at the University of Toronto.
- **Automatic Grading**: Provides detailed, traceable feedback by treating memory models as graph-isomorphism problems. Also allows for line-by-line checking with auto-advancement features available.
- **Multi-Format Export**: Save models as **JSON** (for re-importing or uploading to MarkUs), **SVG**, or **PNG**.

## Developer Setup (Local)

Follow these steps to set up and run the development environment.

### 1. Clone the Repo

```bash
git clone https://github.com/YOUR_USERNAME/memory-model-editor.git
cd memory-model-editor
```

### 2. Set up the Database

MemoryLab requires **PostgreSQL 17 or above**.

#### Install PostgreSQL

- **macOS**: `brew install postgresql@17 && brew services start postgresql@17`
- **Ubuntu/Debian**: `sudo apt update && sudo apt install postgresql-17 postgresql-contrib-17 && sudo systemctl start postgresql`
- **Windows**: Download and install from [postgresql.org](https://www.postgresql.org/download/).

#### Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Update the `.env` file with your database connection string:

```
DATABASE_URL=postgresql://your_username@localhost:5432/memorylab?sslmode=disable
NODE_ENV=development
```

#### Import Database and Questions

```bash
cd backend
npm run import-questions
```

This command creates the database, sets up the `practice_questions` and `test_questions` tables, and imports data from the JSON files in `backend/database/`.

### 3. Launch the Application

| Component    | Commands                                    | URL                     |
| ------------ | ------------------------------------------- | ----------------------- |
| **Frontend** | `cd frontend && npm install && npm run dev` | `http://localhost:3000` |
| **Backend**  | `cd backend && npm install && npm run dev`  | `http://localhost:3001` |

## Production Deployment

### 1. Database Setup

Ensure a PostgreSQL instance (v17+) is running on your server. For OS-specific installation steps, refer to the [Database Setup](#2-set-up-the-database) section above.

#### Configure Environment Variables

```bash
cd backend
cp .env.production .env
```

Update the `.env` file with your database connection string:

```env
DATABASE_URL=postgresql://username:password@hostname:5432/memorylab?sslmode=require
NODE_ENV=production
```

### 2. Install Dependencies and Import

```bash
# Backend
cd backend
npm install
npm run import-questions
```

```bash
# Frontend
cd frontend
npm install
```

### 3. Build and Start

```bash
# Build & Start Backend
cd backend
npm run build
npm start
```

```bash
# Build & Start Frontend
cd frontend
npm run build
npm start
```

## Adding Questions to the Database

1. Edit `backend/database/practiceQuestions.json` or `backend/database/testQuestions.json`.
2. Add your new question to the array following the existing format.
3. Run `npm run import-questions` to re-import.

### Answer Format Examples

**Frame:**

```json
{
    "id": null,
    "name": "__main__",
    "type": ".frame",
    "order": 1,
    "value": {"variable_name": id_reference}
}
```

**Primitive (int, str, bool):**

```json
{ "id": 1, "type": "int", "value": 5 }
```

**List:**

```json
{ "id": 2, "type": "list", "value": [1, 2, 3] }
```

## Technical Details: Validation Algorithm

The validation function (`backend/src/modules/canvasEditor/validateAnswer.ts`) evaluates submissions by treating the memory model as a **graph-isomorphism problem**. The goal is to determine if the user's canvas is structurally identical to the solution.

### Graph Representation

- **Nodes**: Unique "boxes" (primitives, lists, or function frames).
- **Edges**: References formed by variable names (in frames) or pointers (in containers).

The function finds a single, consistent bijection (one-to-one mapping) between the user's box IDs and the answer's box IDs.

### Core Algorithm Implementation

1. **Top-Level Checks (`validateAnswer`)**: Retrieves the solution, scans for duplicate IDs, and validates the structure of function frames.
2. **Frame and Variable Comparison (`compareFrames`)**: Iterates through frames. If a variable exists in both the solution and the submission, it calls `compareIds`.
3. **Recursive ID Comparison (`compareIds`)**:
   - **Bijection Enforcement**: Checks if the current mapping conflicts with existing mappings in `answerToInputMap` and `inputToAnswerMap`.
   - **Type Verification**: Confirms types (e.g., list vs. int) match exactly.
   - **Primitive Value Check**: Direct value comparison for primitives.
   - **Circular References**: Uses a `visited` map to track pairs of IDs to prevent infinite loops in recursive structures.
4. **Collection Checks**:
   - **Arrays (`checkArray`)**: Order-sensitive comparison of elements.
   - **Sets (`checkSet`)**: Performs tentative recursive matching to find a valid mapping in unordered data.
   - **Dictionaries/Objects (`checkDict`/`checkObject`)**: Matches keys/attributes exactly and recurses on the referenced IDs.
5. **Final Checks**:
   - **Call Stack Order**: Verifies that frames are ordered correctly.
   - **Orphan Detection**: Identifies user boxes not reached during traversal (unmapped boxes).

## Automated Grading with MarkUs (WILL NEED TO CHECK)

You can use the `validateAnswer.ts` logic to automate grading for student submissions exported as JSON.

### Setup for MarkUs

1. **Environment**: Ensure the MarkUs testing environment has Node.js and the compiled `validateAnswer.js` (from the `/dist` folder).
2. **Grading Script**: Create a wrapper script that loads the student's exported JSON and the solution JSON from your database.

```javascript
const {
  validateAnswer,
} = require("./dist/modules/canvasEditor/validateAnswer");

// Load files
const studentSubmission = JSON.parse(fs.readFileSync(studentJsonPath));
const expectedSolution = JSON.parse(fs.readFileSync(solutionJsonPath));

// Run algorithm
const result = validateAnswer(studentSubmission, expectedSolution);

// Output for MarkUs
if (result.correct) {
  process.stdout.write("Test Passed: 100%");
} else {
  process.stdout.write("Errors identified:\n" + result.errors.join("\n"));
}
```

3. **Feedback**: The `result.errors` array provides specific reasons for failure, which can be piped directly into the MarkUs feedback file.
