import React from "react";
import { render, fireEvent } from "@testing-library/react";
import RemoveButton from "./RemoveButton";
import { ID } from "../../../shared/types";

// Mocks props and handlers for simulating button behavior
const mockOnRemove = jest.fn();
const mockSetHoverRemove = jest.fn();

const mockElement = {
  id: "box1" as ID,
  kind: {
    name: "primitive",
    type: "int",
  },
};

const defaultProps = {
  element: mockElement,
  onSave: jest.fn(), // unused in the component
  onRemove: mockOnRemove,
  dataType: "int",
  value: "42",
  hoverRemove: false,
  setHoverRemove: mockSetHoverRemove,
  functionName: "f",
  functionParams: [],
  items: [],
};

/**
 * Test suite for the <RemoveButton /> component
 */
describe("RemoveButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Renders without crashing and shows the remove label
   */
  it("renders the remove button", () => {
    const { getByText } = render(<RemoveButton {...defaultProps} />);
    const button = getByText("Remove Box");
    expect(button).toBeInTheDocument();
  });

  /**
   * Fires click and triggers onRemove callback
   */
  it("calls onRemove when clicked", () => {
    const { getByText } = render(<RemoveButton {...defaultProps} />);
    fireEvent.click(getByText("Remove Box"));
    expect(mockOnRemove).toHaveBeenCalled();
  });

  /**
   * Fires mouse enter/leave and updates hover state
   */
  it("calls setHoverRemove on hover events", () => {
    const { getByText } = render(<RemoveButton {...defaultProps} />);
    const button = getByText("Remove Box");

    fireEvent.mouseEnter(button);
    expect(mockSetHoverRemove).toHaveBeenCalledWith(true);

    fireEvent.mouseLeave(button);
    expect(mockSetHoverRemove).toHaveBeenCalledWith(false);
  });
});
