import React from "react";
import { render, fireEvent } from "@testing-library/react";
import IdDisplay from "./IdDisplay";

// Mock IdSelector with a simplified version that invokes props directly
jest.mock("../../../../idSelector/IdSelector", () => ({
  __esModule: true,
  default: ({ currentId, onSelect, onRemove }: any) => (
    <div>
      <div data-testid="current-id">{currentId}</div>
      <button data-testid="select-id" onClick={() => onSelect("selectedId")} />
      <button data-testid="remove-id" onClick={() => onRemove(currentId)} />
    </div>
  ),
}));

/**
 * Test suite for the IdDisplay component
 */
describe("IdDisplay", () => {
  const mockIds = ["a", "b", "c"];
  const addId = jest.fn();
  const setElementId = jest.fn();
  const removeId = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Renders IdSelector with correct ID and triggers selection
   */
  it("renders with correct ID and handles selection", () => {
    const { getByTestId } = render(
      <IdDisplay
        ids={mockIds}
        addId={addId}
        ownId={"b"}
        setElementId={setElementId}
        removeId={removeId}
        sandbox={true}
      />
    );

    expect(getByTestId("current-id").textContent).toBe("b");

    fireEvent.click(getByTestId("select-id"));
    expect(setElementId).toHaveBeenCalledWith("selectedId");
  });

  /**
   * Triggers ID removal when remove button is clicked
   */
  it("handles ID removal on click", () => {
    const { getByTestId } = render(
      <IdDisplay
        ids={mockIds}
        addId={addId}
        ownId={"b"}
        setElementId={setElementId}
        removeId={removeId}
        sandbox={true}
      />
    );

    fireEvent.click(getByTestId("remove-id"));
    expect(removeId).toHaveBeenCalledWith("b");
  });
});
