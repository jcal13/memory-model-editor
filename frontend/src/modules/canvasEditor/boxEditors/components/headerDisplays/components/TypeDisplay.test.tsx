import React from "react";
import { render } from "@testing-library/react";
import TypeDisplay from "./TypeDisplay";

/**
 * Test suite for the TypeDisplay component
 */
describe("TypeDisplay", () => {
  /**
   * Renders the type label correctly
   */
  it("renders the given typeLabel as text", () => {
    const { getByText } = render(<TypeDisplay typeLabel="int" />);
    expect(getByText("int")).toBeInTheDocument();
  });

  /**
   * Applies the correct styling class from CSS module
   */
  it("applies the correct CSS class", () => {
    const { container } = render(<TypeDisplay typeLabel="list" />);
    const div = container.querySelector("div");
    expect(div).toHaveClass("typeDisplay");
  });
});
