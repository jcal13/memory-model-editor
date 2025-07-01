# MemoryLab

A drag-and-drop application for visualizing Python memory models — designed for use in CS education. Students can build memory models by dragging blocks representing functions, variables, and values onto a canvas, and receive automated feedback based on correctness.

---

## Features

- Scratch-style drag-and-drop memory model creation
- Practice using provided question bank; question types include:
  - Build memory model from Python code
  - Fill-in-the-blanks with partial models
- Submit and receive automatic grading and visual feedback
- Downloadable JSON object file for submission on MarkUs

---

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

### 3. Install backend dependencies and start backend server

```bash
cd backend
npm install
npm run dev
```
