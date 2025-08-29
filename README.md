# MemoryLab

A drag-and-drop application for visualizing Python memory models, designed for use in computer science education. Students can build memory models by arranging blocks that represent variables, objects, functions, and values on a canvas, and submit their models for feedback.

## Features

### Interactive Canvas

A Scratch-style canvas for visualizing Python memory models. Users can build diagrams by dragging and dropping blocks that represent frames, objects, and values.

### Practice vs. Test Modes

MemoryLab is designed to support different learning styles. Users can switch between two distinct modes to match your needs for a given exercise.

- **Practice Mode**: A guided environment that provides a more structured experience with a limited options to assist with model construction.

- **Test Mode**: A free-form environment with no constraints, allowing for independent model creation and self-assessment.

### Practice Question Bank

MemoryLab includes a built-in library of exercises for practice. The question bank currently contains two kinds of questions.

- **Practice questions**: questions drawn from previous first year computer science courses at the University of Toronto.
- **Test Questions**: questions drawn from tests from previous first year computer science courses at the University of Toronto.

### Automatic Grading & Feedback

After a model has been constructed, it can be submitted for automatic grading. The system provides detailed, traceable feedback on a dedicated tab, helping you understand where your model can be improved.

### Export & Download Options

Once a model is complete, you can save and export it. The canvas allows for downloads in multiple formats for submission on platforms like Markus or for other uses.

- **JSON**: To save your model as a file that can be re-imported into MemoryLab.

- **SVG**: For a high-quality, scalable vector image.

- **PNG**: For a standard image file.

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

You should see the frontend being run on `http://localhost:3000` in the terminal. You need to open this link in your browser.

![alt text](readmeUtil/image.png)

### 3. Install backend dependencies and start backend server

```bash
cd backend
npm install
npm run dev
```

You should see the backend being run on `http://localhost:3001` in the terminal. You do not need to open this link in your browser.

![alt text](readmeUtil/image-1.png)

### 4. Connect to the database

To view questions in the information tab, you will need a `.env` file in the backend folder. This file must contain the connection string as `DATABASE_URL`. The `.env` file is not included in this repository.
