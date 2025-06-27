// src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import canvasEditorRouter from "./modules/canvasEditor";

const app = express();
const port = 3001;

app.use(cors());

app.use(express.json());

app.use(bodyParser.json());
app.use("/canvasEditor", canvasEditorRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
