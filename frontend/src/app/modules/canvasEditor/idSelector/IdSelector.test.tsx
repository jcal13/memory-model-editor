import { fireEvent, render, screen } from "@testing-library/react";
import IdSelector from "./IdSelector";
import React from "react";
import ReactDOM from "react-dom";

// Mount portals to test environment
beforeAll(() => {
  const portalRoot = document.createElement("div");
  portalRoot.setAttribute("id", "portal-root");
  document.body.appendChild(portalRoot);
  (ReactDOM.createPortal as any) = (node: React.ReactNode) => node;
});

/**
 * Test suite for the IdSelector component.
 */
describe("IdSelector", () => {
  const mockProps = {
    ids: [1, 2, 3],
    currentId: 2,
    onSelect: jest.fn(),
    onAdd: jest.fn(),
    onRemove: jest.fn(),
    buttonClassName: "test-class",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Renders the selector button with current ID.
   */
  it("displays the current ID in the button", () => {
    render(<IdSelector {...mockProps} />);
    expect(screen.getByRole("button")).toHaveTextContent("ID 2");
  });

  /**
   * Opens the panel when the button is clicked.
   */
  it("opens the panel when button is clicked", () => {
    render(<IdSelector {...mockProps} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("id-selector-panel")).toBeInTheDocument();
  });

  /**
   * Calls onSelect and closes the panel when an ID is selected.
   */
  it("calls onSelect when ID is selected", () => {
    render(<IdSelector {...mockProps} />);
    fireEvent.click(screen.getByRole("button"));

    fireEvent.click(screen.getByText("ID 1")); // Assuming ID 1 appears as "ID 1" in panel
    expect(mockProps.onSelect).toHaveBeenCalledWith(1);
    expect(screen.queryByTestId("id-selector-panel")).not.toBeInTheDocument();
  });

  /**
   * Calls onAdd and adds an ID to the list.
   */
  it("calls onAdd when adding a new ID", () => {
    render(<IdSelector {...mockProps} />);
    fireEvent.click(screen.getByRole("button"));

    // Simulate adding ID 99 (not in original list)
    fireEvent.click(screen.getByText("+")); // or call a simulated "Add ID" button
    // You'll need a mock button in the panel that triggers `onAdd(99)`
    expect(mockProps.onAdd).toHaveBeenCalled();
  });

  /**
   * Calls onRemove when removing an ID.
   */
  it("calls onRemove when removing an ID", () => {
    render(<IdSelector {...mockProps} />);
    fireEvent.click(screen.getByRole("button"));

    // Simulate removing ID 2
    fireEvent.click(screen.getByText("−")); // or similar simulated button
    expect(mockProps.onRemove).toHaveBeenCalled();
  });
});
