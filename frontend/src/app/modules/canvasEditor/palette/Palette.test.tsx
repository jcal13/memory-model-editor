import React from "react";
import { render, screen } from "@testing-library/react";
import Palette from "./Palette";

// Mock PaletteBox so we can track its rendering without invoking real SVG logic
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
   * Test that the component renders without error and shows the heading
   */
  it("renders the palette title", () => {
    render(<Palette />);
    expect(screen.getByText("Palette")).toBeInTheDocument();
  });

  /**
   * Test that all expected box types are rendered via PaletteBox
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
   * Test that the number of rendered boxes matches the number of supported types
   */
  it("renders exactly six PaletteBoxes", () => {
    render(<Palette />);
    const allBoxes = screen.getAllByTestId(/palette-box-/);
    expect(allBoxes).toHaveLength(expectedTypes.length);
  });
});
