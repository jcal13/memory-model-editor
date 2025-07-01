import React, { useRef } from "react";
import { render } from "@testing-library/react";
import { usePaletteBoxEffect } from "./useEffect";

// Mocks a DOM-compatible bounding box returned by getBBox
const fakeBBox = {
  x: 0,
  y: 0,
  width: 100,
  height: 50,
  top: 0,
  left: 0,
  right: 100,
  bottom: 50,
  toJSON: () => ({
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    top: 0,
    left: 0,
    right: 100,
    bottom: 50,
  }),
};

// Mocks a DOM-compatible SVG element
const svgElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "svg"
);
const getBBoxMock = jest.fn(() => fakeBBox as DOMRect);
svgElement.getBBox = getBBoxMock as unknown as typeof svgElement.getBBox;
svgElement.setAttribute = jest.fn();

// Mocks createBoxRenderer to return the SVG element
jest.mock("../utils/BoxRenderer", () => ({
  createBoxRenderer: jest.fn(() => svgElement),
}));

/**
 * Helper component to invoke the hook under test
 */
const createTestComponent = (boxType: string) => {
  const TestComponent = () => {
    const ref = useRef<HTMLDivElement>(null);
    usePaletteBoxEffect(ref, boxType);
    return <div ref={ref} data-testid="container" />;
  };

  return render(<TestComponent />);
};

/**
 * Test suite for the usePaletteBoxEffect hook
 */
describe("usePaletteBoxEffect", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Ensures createBoxRenderer is called with the correct boxType
   */
  it("calls createBoxRenderer with the correct boxType", () => {
    const { createBoxRenderer } = require("../utils/BoxRenderer");
    createTestComponent("primitive");
    expect(createBoxRenderer).toHaveBeenCalledWith("primitive");
  });

  /**
   * Verifies that the hook:
   * - Clears existing content
   * - Appends an SVG element
   * - Sets container width and height based on getBBox()
   */
  it("inserts SVG and sets container dimensions", () => {
    const { getByTestId } = createTestComponent("list");
    const container = getByTestId("container");

    expect(container.children.length).toBe(1);
    expect(container.firstChild?.nodeName.toLowerCase()).toBe("svg");
    expect(getBBoxMock).toHaveBeenCalled();
    expect(container.style.width).toBe("105px");
    expect(container.style.height).toBe("55px");
  });
});
