import { useState } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionTab from "./QuestionTab";
import * as api from "./utils/FetchQuestionService";
import { CanvasData, QuestionView, resolveQuestionCanvasData, saveQuestionCanvasData } from "../../memoryModelEditor/utils/localStorage";
import { readQuestionLink } from "./utils/questionLinks";
import { buildJSONFromElements } from "../../validationServices/jsonBuilder";

const studies = require("../../../../../backend/src/database/studyQuestions.json");
jest.mock("./utils/FetchQuestionService");
jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
const restore = jest.fn();
const changed = jest.fn();
function Harness({ mode = true, initialView = "list" }: { mode?: boolean; initialView?: QuestionView }) {
  const [type, setType] = useState<any>("study");
  const [id, setId] = useState<number | null>(initialView === "question" ? 2 : null);
  const [view, setView] = useState<QuestionView>(initialView);
  return <QuestionTab questionType={type} setQuestionType={setType} questionIndex={id} setQuestionIndex={setId}
    questionView={view} setQuestionView={setView} isSandboxMode={mode}
    onSubmit={jest.fn().mockResolvedValue(false)} onSubmitAtLine={jest.fn()}
    setSubmissionResults={jest.fn()} onClearCanvas={jest.fn()} onRestoreCanvas={restore}
    onQuestionDataChange={changed} currentCanvasState={{elements: [], ids: [], classes: []}} />;
}
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  (api.fetchQuestionCount as jest.Mock).mockResolvedValue(5);
  (api.fetchQuestionTopics as jest.Mock).mockResolvedValue([]);
  (api.fetchQuestion as jest.Mock).mockImplementation(async (id: number) => ({ ...studies[id - 1], code: ["a = 5"], answer: [], steps: null }));
});
it("labels all tasks and leaves Tasks 3–5 on existing tools", async () => {
  render(<Harness />);
  expect(screen.getByRole("heading", { name: "Task 2 · Use the feedback" }).closest("details")).toBeNull();
  for (const label of ["Task 1", "Task 2a", "Task 2b", "Task 2c", "Task 2d"]) expect(await screen.findByRole("button", { name: new RegExp(label) })).toBeInTheDocument();
  expect(screen.getByText("Task 3 · Compare the modes")).toBeInTheDocument();
  expect(screen.getByText(/Practice Question 13.*Test mode.*Practice Question 14/)).toBeInTheDocument();
  expect(screen.getByText("Task 4 · Export your diagram")).toBeInTheDocument();
  expect(screen.getByText("Task 5 · Explore the question bank")).toBeInTheDocument();
  expect(api.fetchQuestion).not.toHaveBeenCalled();
});
it("selects, resets and reopens the authored state instead of a saved attempt", async () => {
  localStorage.setItem("question_canvas_study_2", JSON.stringify({ elements: [], ids: [], classes: [] }));
  const mounted = render(<Harness />);
  await userEvent.click(await screen.findByRole("button", { name: /Task 2a/ }));
  await screen.findByRole("heading", { name: "Task 2a" });
  const check = () => expect(restore.mock.calls[restore.mock.calls.length - 1][0]).toEqual(expect.arrayContaining([
    expect.objectContaining({id: 1, kind: expect.objectContaining({value: "9"})}),
  ]));
  check();
  await userEvent.click(screen.getByRole("button", { name: "Reset Question" }));
  await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reset" }));
  await waitFor(() => expect(restore).toHaveBeenCalledTimes(2));
  check();
  await userEvent.click(screen.getByRole("button", {name: "← Back"}));
  await userEvent.click(await screen.findByRole("button", {name: /Task 2a/}));
  await screen.findByRole("heading", {name: "Task 2a"});
  check();
  mounted.unmount();
  render(<Harness initialView="question" />);
  await screen.findByText(studies[1].question);
  check();
  expect(readQuestionLink("?study=2")).toEqual({type: "study", id: 2});
});
it("ignores a late study response after the participant changes modes", async () => {
  let finish!: (value: any) => void;
  (api.fetchQuestion as jest.Mock).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const mounted = render(<Harness />);
  await userEvent.click(await screen.findByRole("button", {name: /Task 2a/}));
  mounted.rerender(<Harness mode={false} />);
  await screen.findByText("Study Questions");
  await act(async () => finish({...studies[1],code: [], answer: []}));
  expect(restore).not.toHaveBeenCalled();
  expect(screen.queryByRole("heading", {name: "Task 2a"})).not.toBeInTheDocument();
});
it("preserves ordinary saved diagrams but always uses the study fallback", () => {
  const authored = studies[1].canvasConfig as CanvasData;
  const saved = {...authored, elements: []};
  saveQuestionCanvasData("practice", 1, saved);
  saveQuestionCanvasData("study", 2, saved);
  expect(resolveQuestionCanvasData("study", 2, authored)).toEqual(authored);
  expect(resolveQuestionCanvasData("practice", 1, authored).elements).toEqual([]);
});
it("serializes every authored error through the existing canvas exporter", () => {
  const models = studies.slice(1).map((s: any) => buildJSONFromElements(s.canvasConfig.elements));
  expect(models[0].find((e: any) => e.id === 1).value).toBe(9);
  expect(models[1].find((e: any) => e.type === ".frame").value).toEqual({a: 1, b: 1});
  expect(models[2].find((e: any) => e.id === 3).value).toEqual([1, 1]);
  expect(models[3].find((e: any) => e.id === 5).value).toEqual([1, 2]);
  expect(models[3].find((e: any) => e.id === 4).value).toBe(9);
});

it("opens Study Questions below Step-by-Step and a separate divider", async () => {
  render(<Harness initialView="root" />);
  const step = screen.getByRole("button", {name: /Step-by-Step Questions/});
  const study = screen.getByRole("button", {name: /Study Questions/});
  expect(step.nextElementSibling).toHaveClass("selectorDivider");
  expect(step.nextElementSibling?.nextElementSibling).toBe(study);
  await userEvent.click(study);
  await userEvent.click(await screen.findByText("Task 2 · Use the feedback"));
  expect(await screen.findByRole("button", {name: /Task 2a/})).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", {name: /Task 2a/}));
  expect(await screen.findByRole("heading", {name: "Task 2a"})).toBeInTheDocument();
});
