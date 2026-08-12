import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionTab, { QuestionData } from "./QuestionTab";
import * as fetchService from "./utils/FetchQuestionService";

jest.mock("./utils/FetchQuestionService");
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockedFetchQuestion = fetchService.fetchQuestion as jest.MockedFunction<
  typeof fetchService.fetchQuestion
>;

describe("QuestionTab component", () => {
  const baseProps = {
    questionIndex: 1,
    setQuestionIndex: jest.fn(),
    questionType: "practice" as const,
    setQuestionType: jest.fn(),
    questionView: "question" as const,
    setQuestionView: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(false),
    onSubmitAtLine: jest.fn().mockResolvedValue(true),
    setSubmissionResults: jest.fn(),
    onClearCanvas: jest.fn(),
    onRestoreCanvas: jest.fn(),
    currentCanvasState: { elements: [], ids: [], classes: [] },
    onQuestionDataChange: jest.fn(),
    isSandboxMode: false,
    fontScale: 1,
  };

  const questionData: QuestionData = {
    id: 1,
    question: "Draw the memory model.",
    code: ["x = 5", "y = x"],
    answer: null,
    steps: [
      { lineNumber: 1, answer: null },
      { lineNumber: 2, iterationNumber: 0, answer: null },
    ],
    description: null,
    topics: null,
    canvasConfig: null,
  };

  beforeEach(() => {
    mockedFetchQuestion.mockResolvedValue(questionData);
    jest.clearAllMocks();
  });

  it("shows the auto advance checkbox and moves to the next line after a successful line check", async () => {
    const onSubmitAtLine = jest.fn().mockResolvedValue(true);
    const user = userEvent;

    render(
      <QuestionTab
        {...baseProps}
        onSubmitAtLine={onSubmitAtLine}
      />
    );

    await screen.findByText(/draw the memory model/i);
    await waitFor(() => expect(mockedFetchQuestion).toHaveBeenCalledTimes(1));

    const toggle = screen.getByRole("switch", {
      name: /auto advance to next checkable line/i,
    });
    expect(toggle).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toBeChecked();

    const line1 = await screen.findByTitle("Check answer at line 1");
    await user.click(line1);

    const checkButton = await screen.findByRole("button", {
      name: /check answer at line 1/i,
    });
    await user.click(checkButton);

    expect(onSubmitAtLine).toHaveBeenCalledWith(1, undefined);

    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /check answer at line 2/i,
        })
      ).toBeInTheDocument()
    );
  });

  it("preselects the next line iteration when the next checkable line has iterations", async () => {
    const onSubmitAtLine = jest.fn().mockResolvedValue(true);
    const user = userEvent;

    const questionWithIteration: QuestionData = {
      ...questionData,
      steps: [
        { lineNumber: 1, answer: null },
        { lineNumber: 2, iterationNumber: 1, answer: null },
      ],
    };
    mockedFetchQuestion.mockResolvedValueOnce(questionWithIteration);

    render(
      <QuestionTab
        {...baseProps}
        onSubmitAtLine={onSubmitAtLine}
      />
    );

    await screen.findByText(/draw the memory model/i);
    await waitFor(() => expect(mockedFetchQuestion).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("switch", {
      name: /auto advance to next checkable line/i,
    }));

    await user.click(screen.getByTitle("Check answer at line 1"));
    await user.click(await screen.findByRole("button", { name: /check answer at line 1/i }));

    await waitFor(() => expect(onSubmitAtLine).toHaveBeenCalledWith(1, undefined));
    expect(
      screen.getByRole("button", {
        name: /check answer at line 2/i,
      })
    ).toBeInTheDocument();
  });

  it("auto-advances back to a lower line number when the next step loops back to an earlier line", async () => {
    const onSubmitAtLine = jest.fn().mockResolvedValue(true);
    const user = userEvent;

    const loopQuestion: QuestionData = {
      ...questionData,
      code: ["lst = [1, 2]", "for item in lst:", "    lst.append(item, 88)"],
      steps: [
        { lineNumber: 3, iterationNumber: 1, answer: null },
        { lineNumber: 2, iterationNumber: 2, answer: null },
      ],
    };
    mockedFetchQuestion.mockResolvedValueOnce(loopQuestion);

    render(<QuestionTab {...baseProps} onSubmitAtLine={onSubmitAtLine} />);

    await screen.findByText(/draw the memory model/i);
    await waitFor(() => expect(mockedFetchQuestion).toHaveBeenCalledTimes(1));

    await user.click(
      screen.getByRole("switch", { name: /auto advance to next checkable line/i })
    );

    // Select line 3 then pick iteration 1
    await user.click(screen.getByTitle("Check answer at line 3"));
    await user.click(await screen.findByRole("button", { name: "1" }));

    // Submit the check at line 3, iter 1
    await user.click(await screen.findByRole("button", { name: /check answer at line 3/i }));
    expect(onSubmitAtLine).toHaveBeenCalledWith(3, 1);

    // Auto-advance should jump back to line 2 with iteration 2 already selected
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /check answer at line 2/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent("iter 2");
    });
  });

  it("does not auto-advance when the check fails", async () => {
    const onSubmitAtLine = jest.fn().mockResolvedValue(false);
    const user = userEvent;

    render(<QuestionTab {...baseProps} onSubmitAtLine={onSubmitAtLine} />);

    await screen.findByText(/draw the memory model/i);
    await waitFor(() => expect(mockedFetchQuestion).toHaveBeenCalledTimes(1));

    await user.click(
      screen.getByRole("switch", { name: /auto advance to next checkable line/i })
    );

    await user.click(screen.getByTitle("Check answer at line 1"));
    await user.click(await screen.findByRole("button", { name: /check answer at line 1/i }));

    await waitFor(() => expect(onSubmitAtLine).toHaveBeenCalledWith(1, undefined));
    // Line 1 should still be selected (no advance)
    expect(
      screen.getByRole("button", { name: /check answer at line 1/i })
    ).toBeInTheDocument();
  });

  // ─── Step-by-step mode ────────────────────────────────────────────────────

  describe("Step-by-step mode", () => {
    const sbsQuestion: QuestionData = {
      id: 1,
      question: "Draw the memory model after all the code has executed.",
      code: ["a = 5", "b = 4"],
      answer: null,
      steps: [
        { lineNumber: 1, answer: null },
        { lineNumber: 2, answer: null },
      ],
      description: null,
      topics: null,
      canvasConfig: null,
    };

    // Canvas state helpers — plain objects matching the shape CanvasElement reads
    const step1Canvas = {
      elements: [
        {
          boxId: 0, id: "_", x: 0, y: 0,
          kind: { name: "function", type: "function", value: null, functionName: "__main__", params: [{ name: "a", targetId: 1 }] },
        },
        { boxId: 1, id: 1, x: 100, y: 0, kind: { name: "primitive", type: "int", value: "5" } },
      ],
      ids: [1], classes: [],
    };

    // a now maps to id 2 instead of id 1 — violates consistency
    const step2WrongIdCanvas = {
      elements: [
        {
          boxId: 0, id: "_", x: 0, y: 0,
          kind: { name: "function", type: "function", value: null, functionName: "__main__", params: [{ name: "a", targetId: 2 }, { name: "b", targetId: 1 }] },
        },
        { boxId: 1, id: 1, x: 100, y: 0, kind: { name: "primitive", type: "int", value: "4" } },
        { boxId: 2, id: 2, x: 200, y: 0, kind: { name: "primitive", type: "int", value: "5" } },
      ],
      ids: [1, 2], classes: [],
    };

    // id 1 changed from int to str — violates consistency
    const step2WrongTypeCanvas = {
      elements: [
        {
          boxId: 0, id: "_", x: 0, y: 0,
          kind: { name: "function", type: "function", value: null, functionName: "__main__", params: [{ name: "a", targetId: 1 }] },
        },
        { boxId: 1, id: 1, x: 100, y: 0, kind: { name: "primitive", type: "str", value: "hello" } },
      ],
      ids: [1], classes: [],
    };

    // Correct cumulative state for step 2: a→1 preserved, b→2 added
    const step2CorrectCanvas = {
      elements: [
        {
          boxId: 0, id: "_", x: 0, y: 0,
          kind: { name: "function", type: "function", value: null, functionName: "__main__", params: [{ name: "a", targetId: 1 }, { name: "b", targetId: 2 }] },
        },
        { boxId: 1, id: 1, x: 100, y: 0, kind: { name: "primitive", type: "int", value: "5" } },
        { boxId: 2, id: 2, x: 200, y: 0, kind: { name: "primitive", type: "int", value: "4" } },
      ],
      ids: [1, 2], classes: [],
    };

    // Props that start in root view (no question pre-loaded)
    const sbsBaseProps = {
      ...baseProps,
      questionView: "root" as const,
      currentCanvasState: { elements: [] as any[], ids: [] as number[], classes: [] as string[] },
    };

    beforeEach(() => {
      mockedFetchQuestion.mockResolvedValue(sbsQuestion);
    });

    /** Click "Step-by-Step Questions" and wait for the first step to appear. */
    async function enterStepByStep(canvasState = sbsBaseProps.currentCanvasState) {
      const onSubmitAtLine = jest.fn().mockResolvedValue(true);
      const utils = render(
        <QuestionTab {...sbsBaseProps} onSubmitAtLine={onSubmitAtLine} currentCanvasState={canvasState} />
      );
      await userEvent.click(screen.getByRole("button", { name: /step-by-step questions/i }));
      await screen.findByText(/step 1 of 2/i);
      return { ...utils, onSubmitAtLine };
    }

    it("shows step indicator and Check button after entering step-by-step mode", async () => {
      await enterStepByStep();
      expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /check line 1/i })).toBeInTheDocument();
      expect(screen.getByText(/draw the memory model after executing line 1/i)).toBeInTheDocument();
    });

    it("advances to the next step when the check is correct", async () => {
      const { onSubmitAtLine } = await enterStepByStep(step1Canvas);

      await userEvent.click(screen.getByRole("button", { name: /check line 1/i }));

      expect(onSubmitAtLine).toHaveBeenCalledWith(1, undefined);
      await screen.findByText(/step 2 of 2/i);
      expect(screen.getByRole("button", { name: /check line 2/i })).toBeInTheDocument();
    });

    it("stays on the same step when the check is incorrect", async () => {
      const onSubmitAtLine = jest.fn().mockResolvedValue(false);
      render(<QuestionTab {...sbsBaseProps} onSubmitAtLine={onSubmitAtLine} />);
      await userEvent.click(screen.getByRole("button", { name: /step-by-step questions/i }));
      await screen.findByText(/step 1 of 2/i);

      await userEvent.click(screen.getByRole("button", { name: /check line 1/i }));

      expect(onSubmitAtLine).toHaveBeenCalledWith(1, undefined);
      expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();
    });

    it("shows a consistency error and skips the backend when variable→id mapping changes", async () => {
      const { onSubmitAtLine, rerender } = await enterStepByStep(step1Canvas);

      // Pass step 1 — commits a→1, id1=int
      await userEvent.click(screen.getByRole("button", { name: /check line 1/i }));
      await screen.findByText(/step 2 of 2/i);

      // Switch to canvas where a now points to id 2
      rerender(<QuestionTab {...sbsBaseProps} onSubmitAtLine={onSubmitAtLine} currentCanvasState={step2WrongIdCanvas} />);

      await userEvent.click(screen.getByRole("button", { name: /check line 2/i }));

      expect(screen.getByText(/variable "a" must point to id 1/i)).toBeInTheDocument();
      // Backend should NOT have been called for step 2
      expect(onSubmitAtLine).toHaveBeenCalledTimes(1);
    });

    it("shows a consistency error and skips the backend when an id's type changes", async () => {
      const { onSubmitAtLine, rerender } = await enterStepByStep(step1Canvas);

      // Pass step 1 — commits id1=int
      await userEvent.click(screen.getByRole("button", { name: /check line 1/i }));
      await screen.findByText(/step 2 of 2/i);

      // Switch to canvas where id1 is now a str
      rerender(<QuestionTab {...sbsBaseProps} onSubmitAtLine={onSubmitAtLine} currentCanvasState={step2WrongTypeCanvas} />);

      await userEvent.click(screen.getByRole("button", { name: /check line 2/i }));

      expect(screen.getByText(/id 1.*int.*str|id 1 was a int/i)).toBeInTheDocument();
      expect(onSubmitAtLine).toHaveBeenCalledTimes(1);
    });

    it("clears the error and calls the backend when the canvas is fixed", async () => {
      const { onSubmitAtLine, rerender } = await enterStepByStep(step1Canvas);

      // Pass step 1
      await userEvent.click(screen.getByRole("button", { name: /check line 1/i }));
      await screen.findByText(/step 2 of 2/i);

      // Wrong canvas → error appears
      rerender(<QuestionTab {...sbsBaseProps} onSubmitAtLine={onSubmitAtLine} currentCanvasState={step2WrongIdCanvas} />);
      await userEvent.click(screen.getByRole("button", { name: /check line 2/i }));
      expect(screen.getByText(/variable "a" must point to id 1/i)).toBeInTheDocument();

      // Correct canvas → error clears, backend called
      rerender(<QuestionTab {...sbsBaseProps} onSubmitAtLine={onSubmitAtLine} currentCanvasState={step2CorrectCanvas} />);
      await userEvent.click(screen.getByRole("button", { name: /check line 2/i }));

      expect(screen.queryByText(/must point to id/i)).not.toBeInTheDocument();
      expect(onSubmitAtLine).toHaveBeenCalledTimes(2);
    });

    it("shows completion message and Try Again button after all steps pass", async () => {
      const { onSubmitAtLine, rerender } = await enterStepByStep(step1Canvas);

      // Step 1
      await userEvent.click(screen.getByRole("button", { name: /check line 1/i }));
      await screen.findByText(/step 2 of 2/i);

      // Step 2
      rerender(<QuestionTab {...sbsBaseProps} onSubmitAtLine={onSubmitAtLine} currentCanvasState={step2CorrectCanvas} />);
      await userEvent.click(screen.getByRole("button", { name: /check line 2/i }));

      await screen.findByText(/all steps complete!/i);
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /check line/i })).not.toBeInTheDocument();
    });

    it("Reset restores canvas to initial state and returns to Step 1", async () => {
      const onRestoreCanvas = jest.fn();
      const onSubmitAtLine = jest.fn().mockResolvedValue(true);
      render(
        <QuestionTab
          {...sbsBaseProps}
          onSubmitAtLine={onSubmitAtLine}
          onRestoreCanvas={onRestoreCanvas}
          currentCanvasState={step1Canvas}
        />
      );

      await userEvent.click(screen.getByRole("button", { name: /step-by-step questions/i }));
      await screen.findByText(/step 1 of 2/i);

      // Advance to step 2
      await userEvent.click(screen.getByRole("button", { name: /check line 1/i }));
      await screen.findByText(/step 2 of 2/i);

      // Reset
      await userEvent.click(screen.getByRole("button", { name: /^reset$/i }));

      await screen.findByText(/step 1 of 2/i);
      expect(onRestoreCanvas).toHaveBeenCalled();
    });

    it("Back button returns to the root category view", async () => {
      await enterStepByStep();

      await userEvent.click(screen.getByRole("button", { name: /back/i }));

      await screen.findByText(/^practice questions$/i);
      expect(screen.queryByText(/step \d+ of/i)).not.toBeInTheDocument();
    });
  });
});
