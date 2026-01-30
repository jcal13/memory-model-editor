import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import canvasEditorRouter from "./features/validationServices";
import questionModuleRouter from "./features/informationTabs/questionTab";

const app = express();

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const host = process.env.HOST || "0.0.0.0";

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use("/canvasEditor", canvasEditorRouter);
app.use("/questions", questionModuleRouter);

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});