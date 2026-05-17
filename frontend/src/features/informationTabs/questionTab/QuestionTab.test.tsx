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

    const checkbox = screen.getByRole("checkbox", {
      name: /auto advance to next checkable line/i,
    });
    expect(checkbox).toBeInTheDocument();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

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

    await user.click(screen.getByRole("checkbox", {
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
});
