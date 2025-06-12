import React from "react";
import { render, fireEvent } from "@testing-library/react";
import Canvas from "./Canvas";
import { CanvasElement } from "../shared/types";

/**
 * Set up necessary DOM mocks for SVG-specific methods
 * that are not implemented in jsdom but used in the Canvas component.
 */
beforeAll(() => {
  // Mock getBBox on SVG elements to return fixed dimensions
  (SVGElement.prototype as any).getBBox = function () {
    return { width: 100, height: 50, x: 0, y: 0 };
  };

  // Mock createSVGPoint to simulate transformation logic
  SVGSVGElement.prototype.createSVGPoint = function () {
    return {
      x: 0,
      y: 0,
      matrixTransform: () => ({ x: 50, y: 50 }),
    } as DOMPoint;
  };

  // Mock getScreenCTM to return a basic identity matrix
  SVGSVGElement.prototype.getScreenCTM = function () {
    return {
      inverse: () => ({
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 0,
        f: 0,
        isIdentity: true,
        flipX: () => this,
        flipY: () => this,
        inverse: () => this,
        multiply: () => this,
        rotate: () => this,
        rotateFromVector: () => this,
        scale: () => this,
        scaleNonUniform: () => this,
        skewX: () => this,
        skewY: () => this,
        translate: () => this,
        toString: () => "",
      }),
    } as unknown as DOMMatrix;
  };
});

describe("Canvas", () => {
  /**
   * Test that verifies the Canvas component renders without crashing
   * and displays the expected SVG wrapper element.
   */
  it("renders all canvas elements correctly", () => {
    const elements: CanvasElement[] = [
      {
        id: 1,
        x: 10,
        y: 20,
        kind: { name: "primitive", type: "None", value: "None" },
      },
    ];

    const setElements = jest.fn();

    const { getByTestId } = render(
      <Canvas elements={elements} setElements={setElements} />
    );

    expect(getByTestId("canvas")).toBeInTheDocument();
  });

  /**
   * Test that simulates a drop event on the canvas and verifies that
   * the `setElements` callback is called to add a new element.
   */
  it("adds a new element on drop", () => {
    const elements: CanvasElement[] = [];
    const setElements = jest.fn();

    const { getByTestId } = render(
      <Canvas elements={elements} setElements={setElements} />
    );

    const svg = getByTestId("canvas");

    // Simulate drag-and-drop event
    const dataTransfer = {
      getData: () => "primitive",
    };

    fireEvent.drop(svg, {
      dataTransfer,
      clientX: 50,
      clientY: 50,
    });

    expect(setElements).toHaveBeenCalled();
  });
});
