import React, { useRef } from "react";
import { render } from "@testing-library/react";
import { usePaletteBoxEffect } from "./useEffect";

// ====== DOM-compatible SVG setup ======

// Create a fake bounding box (DOMRect-like)
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

// Create an actual DOM-compatible SVG element
const svgElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "svg"
);

// Mock getBBox and setAttribute for the SVG element
const getBBoxMock = jest.fn(() => fakeBBox as DOMRect);
svgElement.getBBox = getBBoxMock as unknown as typeof svgElement.getBBox;
svgElement.setAttribute = jest.fn();

// Mock createBoxRenderer to return our DOM-compatible SVG element
jest.mock("../utils/BoxRenderer", () => ({
  createBoxRenderer: jest.fn(() => svgElement),
}));

/**
 * Helper component that mounts the hook under test
 * with a test container and the given boxType.
 */
const createTestComponent = (boxType: string) => {
  const TestComponent = () => {
    const ref = useRef<HTMLDivElement>(null);
    usePaletteBoxEffect(ref, boxType);
    return <div ref={ref} data-testid="container" />;
  };

  return render(<TestComponent />);
};

describe("usePaletteBoxEffect", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test that the hook calls createBoxRenderer with the given boxType.
   */
  it("calls createBoxRenderer with the correct boxType", () => {
    const { createBoxRenderer } = require("../utils/BoxRenderer");
    createTestComponent("primitive");

    expect(createBoxRenderer).toHaveBeenCalledWith("primitive");
  });

  /**
   * Test that the hook:
   *  - Clears the container
   *  - Appends the SVG element
   *  - Sets width and height using getBBox()
   */
  it("inserts SVG and sets container dimensions", () => {
    const { getByTestId } = createTestComponent("list");
    const container = getByTestId("container");

    // Check that one SVG element is appended
    expect(container.children.length).toBe(1);
    expect(container.firstChild?.nodeName.toLowerCase()).toBe("svg");

    // Check that getBBox was called and used
    expect(getBBoxMock).toHaveBeenCalled();
    expect(container.style.width).toBe(`${fakeBBox.width + 5}px`);
    expect(container.style.height).toBe(`${fakeBBox.height + 5}px`);
  });
});
