import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import canvasEditorRouter from "./features/validationServices";
import questionModuleRouter from "./features/informationTabs/questionTab";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use("/canvasEditor", canvasEditorRouter);
app.use("/questions", questionModuleRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
