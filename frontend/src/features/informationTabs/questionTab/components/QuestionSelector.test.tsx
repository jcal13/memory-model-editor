import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import QuestionSelector from "./QuestionSelector";

describe("QuestionSelector help icon", () => {
  it("renders a help icon on a category card when helpText is provided", () => {
    render(
      <QuestionSelector
        variant="category"
        text="Practice Questions"
        categoryType="practice"
        onClick={jest.fn()}
        helpText="Build the memory model yourself."
      />
    );

    expect(
      screen.getByRole("button", { name: "Help: Practice Questions" })
    ).toBeInTheDocument();
  });

  it("does not render a help icon when helpText is omitted", () => {
    render(
      <QuestionSelector
        variant="category"
        text="Practice Questions"
        categoryType="practice"
        onClick={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("button", { name: /^Help/ })
    ).not.toBeInTheDocument();
  });

  it("does not trigger the card's onClick when the help icon is clicked", () => {
    const handleClick = jest.fn();
    render(
      <QuestionSelector
        variant="category"
        text="Practice Questions"
        categoryType="practice"
        onClick={handleClick}
        helpText="Build the memory model yourself."
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Help: Practice Questions" })
    );

    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText("Build the memory model yourself.")
    ).toBeInTheDocument();
  });

  it("still triggers onClick when the rest of the card is clicked", () => {
    const handleClick = jest.fn();
    render(
      <QuestionSelector
        variant="category"
        text="Practice Questions"
        categoryType="practice"
        onClick={handleClick}
        helpText="Build the memory model yourself."
      />
    );

    fireEvent.click(screen.getByText("Practice Questions"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not render a help icon for the pill variant", () => {
    render(<QuestionSelector variant="pill" text="Q1" onClick={jest.fn()} />);

    expect(
      screen.queryByRole("button", { name: /^Help/ })
    ).not.toBeInTheDocument();
  });
});
