import React from "react";
import { render, fireEvent } from "@testing-library/react";
import CollectionAddButton from "./CollectionAddButton";

/**
 * Test suite for the <CollectionAddButton /> component
 */
describe("CollectionAddButton", () => {
  /**
   * Renders without crashing and displays default text for single mode
   */
  it("renders with default label in single mode", () => {
    const setItems = jest.fn();
    const { getByText } = render(
      <CollectionAddButton mode="single" items={[]} setItems={setItems} />
    );
    expect(getByText("+ Add Element")).toBeInTheDocument();
  });

  /**
   * Renders without crashing and displays default text for pair mode
   */
  it("renders with default label in pair mode", () => {
    const setItems = jest.fn();
    const { getByText } = render(
      <CollectionAddButton mode="pair" items={[]} setItems={setItems} />
    );
    expect(getByText("+ Add Pair")).toBeInTheDocument();
  });

  /**
   * Displays custom button text when provided
   */
  it("renders custom button text when passed", () => {
    const setItems = jest.fn();
    const { getByText } = render(
      <CollectionAddButton
        mode="single"
        items={[]}
        setItems={setItems}
        buttonText="Add Item"
      />
    );
    expect(getByText("Add Item")).toBeInTheDocument();
  });

  /**
   * Adds null to items in single mode when clicked
   */
  it("adds null to items array in single mode", () => {
    const setItems = jest.fn();
    const items = [1, 2];
    const { getByText } = render(
      <CollectionAddButton mode="single" items={items} setItems={setItems} />
    );
    fireEvent.click(getByText("+ Add Element"));
    expect(setItems).toHaveBeenCalledWith([1, 2, null]);
  });

  /**
   * Adds a key-value pair to items in pair mode when clicked
   */
  it('adds ["None", "None"] to items array in pair mode', () => {
    const setItems = jest.fn();
    const items = [["a", 1]];
    const { getByText } = render(
      <CollectionAddButton mode="pair" items={items} setItems={setItems} />
    );
    fireEvent.click(getByText("+ Add Pair"));
    expect(setItems).toHaveBeenCalledWith([
      ["a", 1],
      ["None", "None"],
    ]);
  });
});
