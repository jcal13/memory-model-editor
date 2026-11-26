import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AddObjectPicker, { ADD_CHOICES } from "./AddObjectPicker";

describe("AddObjectPicker", () => {
  const setup = () => {
    const onPick = jest.fn();
    const onClose = jest.fn();
    render(<AddObjectPicker choices={ADD_CHOICES} onPick={onPick} onClose={onClose} />);
    return { onPick, onClose, list: screen.getByRole("listbox", { name: /Add object/ }) };
  };

  it("is a focused listbox that picks with arrows and Enter", () => {
    const { onPick, list } = setup();
    expect(list).toHaveFocus();
    expect(list).toHaveAttribute("aria-activedescendant", "add-object-int");
    fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(list).toHaveAttribute("aria-activedescendant", "add-object-float");
    fireEvent.keyDown(list, { key: "Enter" });
    expect(onPick).toHaveBeenCalledWith("float");
  });

  it("picks by letter and closes on Escape", () => {
    const { onPick, onClose, list } = setup();
    fireEvent.keyDown(list, { key: "l" });
    expect(onPick).toHaveBeenCalledWith("list");
    fireEvent.keyDown(list, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
