# MemoryLab

A drag-and-drop application for visualizing Python memory models, designed for use in computer science education. Students can build memory models by arranging blocks that represent variables, objects, functions, and values on a canvas, and submit their models for feedback.

## Features

### Scratch-style canvas

- Drag-and-drop blocks onto a canvas to create or edit a memory model
  <short demo here>

### Question bank for practice

- _Build from code_: construct a full memory model diagram from a given Python snippet
- _Fill-in-the-blanks_: complete partially-built models to test specific concepts
  <short demo here>

### Custom questions

- Paste your own Python code to practice new exercises
  <short demo here>

### Automatic grading and visual feedback

- Submit a model and get detailed feedback about correctness
  <short demo here>

### Checkpoint validation

- Insert checkpoints in questions to verify your work incrementally

  <short demo here>

### Export to JSON

- Download your completed model as a JSON file ready for MarkUs submission
  <short demo here>

## Developer Instructions

For developers, follow these steps to set up and run the development environment:

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/memory-model-editor.git
cd memory-model-editor
```

### 2. Install frontend dependencies and start frontend server

```bash
cd frontend
npm install
npm run dev
```

You should see the frontend being run on `http://localhost:3000` in the terminal.

![alt text](readmeUtil/image.png)

### 3. Install backend dependencies and start backend server

```bash
cd backend
npm install
npm run dev
```

You should see the backend being run on `http://localhost:3001` in the terminal.

![alt text](readmeUtil/image-1.png)
