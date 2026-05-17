import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import InformationTabs from "./InformationTabs";

jest.mock("./questionTab/QuestionTab", () => ({
  __esModule: true,
  default: () => <div data-testid="question-tab" />,
}));

describe("InformationTabs", () => {
  const defaultProps = {
    submissionResults: null,
    questionSelected: true,
    questionIndex: 1,
    setQuestionIndex: jest.fn(),
    questionType: "experiment" as const,
    setQuestionType: jest.fn(),
    questionView: "root" as any,
    setQuestionView: jest.fn(),
    onSubmit: jest.fn(async () => true),
    onSubmitAtLine: jest.fn(async () => true),
    setSubmissionResults: jest.fn(),
    onClearCanvas: jest.fn(),
    onRestoreCanvas: jest.fn(),
    currentCanvasState: { elements: [], ids: [], classes: [] },
    masterErrorList: {} as any,
    elements: [],
    setElements: jest.fn(),
    onOpenEditor: jest.fn(),
    isSandboxMode: false,
    onQuestionDataChange: jest.fn(),
    tabScrollPositions: { question: 0 },
    setTabScrollPositions: jest.fn(),
    fontScale: 1,
  };

  it("renders the question section and feedback section in one panel", () => {
    const { container } = render(<InformationTabs {...defaultProps} />);

    expect(screen.getByTestId("question-tab")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /feedback/i })).toBeInTheDocument();
    expect(container.querySelector("[role='tablist']")).not.toBeInTheDocument();

    const questionNode = screen.getByTestId("question-tab");
    const feedbackHeading = screen.getByRole("heading", { name: /feedback/i });
    expect(
      questionNode.compareDocumentPosition(feedbackHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
