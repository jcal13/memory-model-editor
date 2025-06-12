import React from "react";
import { render, screen } from "@testing-library/react";
import Palette from "./Palette";

// Mocks the PaletteBox component to intercept rendering
jest.mock(
  "./components/PaletteBox",
  () =>
    ({ boxType }: { boxType: string }) =>
      (
        <div data-testid={`palette-box-${boxType}`} draggable>
          {boxType}
        </div>
      )
);

/**
 * Test suite for the Palette component
 */
describe("Palette", () => {
  const expectedTypes = [
    "function",
    "primitive",
    "list",
    "tuple",
    "set",
    "dict",
  ];

  /**
   * Ensures that the title "Palette" is rendered
   */
  it("renders the palette title", () => {
    render(<Palette />);
    expect(screen.getByText("Palette")).toBeInTheDocument();
  });

  /**
   * Verifies that all expected box types render via PaletteBox
   */
  it("renders all box types", () => {
    render(<Palette />);
    expectedTypes.forEach((type) => {
      const box = screen.getByTestId(`palette-box-${type}`);
      expect(box).toBeInTheDocument();
      expect(box).toHaveAttribute("draggable", "true");
      expect(box).toHaveTextContent(type);
    });
  });

  /**
   * Checks that exactly six PaletteBoxes are rendered
   */
  it("renders exactly six PaletteBoxes", () => {
    render(<Palette />);
    const allBoxes = screen.getAllByTestId(/palette-box-/);
    expect(allBoxes).toHaveLength(expectedTypes.length);
  });
});
