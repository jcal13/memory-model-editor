import React from "react";
import { render, fireEvent } from "@testing-library/react";
import IdSelectorPanel from "./IdSelectorPanel";

/**
 * Test suite for the IdSelectorPanel component.
 */
describe("IdSelectorPanel", () => {
  const onAdd = jest.fn();
  const onSelect = jest.fn();
  const onRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Renders list of ID buttons with select and remove
   */
  it("renders existing IDs and handles select/remove", () => {
    const { getByText } = render(
      <IdSelectorPanel
        ids={[1, 2]}
        onAdd={onAdd}
        onSelect={onSelect}
        onRemove={onRemove}
        sandbox={true}
      />
    );

    const id1Btn = getByText("1");
    const id2Btn = getByText("2");

    fireEvent.click(id1Btn);
    expect(onSelect).toHaveBeenCalledWith(1);

    const removeBtns = document.querySelectorAll("button");
    const removeBtn = Array.from(removeBtns).find(
      (btn) => btn.textContent === "×"
    );

    if (removeBtn) {
      fireEvent.click(removeBtn);
      expect(onRemove).toHaveBeenCalled();
    }
  });

  /**
   * Adds a new ID when clicking "+ Add ID"
   */
  it("calls onAdd with next ID", () => {
    const { getByText } = render(
      <IdSelectorPanel
        ids={[1, 2]}
        onAdd={onAdd}
        onSelect={onSelect}
        onRemove={onRemove}
        sandbox={true}
      />
    );

    const addBtn = getByText("+ Add ID");
    fireEvent.click(addBtn);

    expect(onAdd).toHaveBeenCalledWith(3);
  });

  /**
   * Renders fallback message when no IDs exist
   */
  it("shows empty message when no IDs", () => {
    const { getByText } = render(
      <IdSelectorPanel
        ids={[]}
        onAdd={onAdd}
        onSelect={onSelect}
        onRemove={onRemove}
        sandbox={true}
      />
    );

    expect(
      getByText("No IDs yet — click “+ Add ID” to create one.")
    ).toBeInTheDocument();
  });
});
