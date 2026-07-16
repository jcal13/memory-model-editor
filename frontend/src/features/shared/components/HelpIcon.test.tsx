import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import HelpIcon from "./HelpIcon";

describe("HelpIcon", () => {
  it("does not show the explanation until the icon is clicked", () => {
    render(<HelpIcon text="Explains the thing." />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Explains the thing.")).not.toBeInTheDocument();
  });

  it("labels the icon 'Help' when no title is given", () => {
    render(<HelpIcon text="Explains the thing." />);

    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
  });

  it("opens a dialog with the title and explanation on click", () => {
    render(<HelpIcon title="My Feature" text="Explains the thing." />);

    fireEvent.click(screen.getByRole("button", { name: "Help: My Feature" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("My Feature")).toBeInTheDocument();
    expect(screen.getByText("Explains the thing.")).toBeInTheDocument();
  });

  it("closes when the close button is clicked", () => {
    render(<HelpIcon text="Explains the thing." />);

    fireEvent.click(screen.getByRole("button", { name: "Help" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when clicking the backdrop outside the dialog", () => {
    render(<HelpIcon text="Explains the thing." />);

    fireEvent.click(screen.getByRole("button", { name: "Help" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("presentation"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close when clicking inside the dialog content", () => {
    render(<HelpIcon text="Explains the thing." />);

    fireEvent.click(screen.getByRole("button", { name: "Help" }));
    fireEvent.click(screen.getByText("Explains the thing."));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes when the Escape key is pressed", () => {
    render(<HelpIcon text="Explains the thing." />);

    fireEvent.click(screen.getByRole("button", { name: "Help" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not react to Escape while closed", () => {
    render(<HelpIcon text="Explains the thing." />);

    expect(() => fireEvent.keyDown(document, { key: "Escape" })).not.toThrow();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // The ancestor uses role="button" on a <div> rather than a real <button>,
  // matching how HelpIcon is nested inside clickable cards in this codebase
  // (a <button> can't validly contain another <button>).
  it("stops clicks from bubbling to a clickable ancestor", () => {
    const handleParentClick = jest.fn();
    render(
      <div role="button" tabIndex={0} onClick={handleParentClick}>
        Card
        <HelpIcon text="Explains the thing." />
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Help" }));

    expect(handleParentClick).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("clicking the ancestor elsewhere still fires its own handler", () => {
    const handleParentClick = jest.fn();
    render(
      <div role="button" tabIndex={0} onClick={handleParentClick}>
        Card
        <HelpIcon text="Explains the thing." />
      </div>
    );

    fireEvent.click(screen.getByText("Card"));

    expect(handleParentClick).toHaveBeenCalledTimes(1);
  });
});
