import { render, screen } from "@testing-library/react";
import FeedbackTab from "./FeedbackTab";

describe("FeedbackTab", () => {
  const defaultProps = {
    submissionResults: null,
    questionSelected: true,
    questionIndex: 1,
    questionType: "experiment" as const,
    masterErrorList: {} as any,
    elements: [],
    setElements: jest.fn(),
    onOpenEditor: jest.fn(),
    isSandboxMode: false,
    onResubmit: jest.fn(async () => true),
    resubmitLine: null,
    fontScale: 1,
  };

  it("renders the experiment feedback heading with question number", () => {
    render(<FeedbackTab {...defaultProps} />);

    expect(
      screen.getByRole("heading", {
        name: /feedback - experiment question 1/i,
      })
    ).toBeInTheDocument();
  });
});
