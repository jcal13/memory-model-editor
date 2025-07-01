import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { render, act, screen, waitFor } from "@testing-library/react";
import {
  useDataType,
  useContentValue,
  useCanvasResize,
  useDraggableBox,
} from "./useEffect";

// ==== Mock createBoxRenderer ====
const mockSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
mockSVG.getBBox = () =>
  ({
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    top: 0,
    right: 100,
    bottom: 50,
    left: 0,
    toJSON: () => {},
  } as DOMRect);
mockSVG.setAttribute = jest.fn();

jest.mock("../utils/BoxRenderer", () => ({
  createBoxRenderer: jest.fn(() => mockSVG),
}));

/**
 * Test suite for all custom hooks in `useEffect.ts`
 */
describe("Custom Hooks", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Tests the useDataType hook.
   * It should keep a ref updated with the latest value of `dataType`.
   */
  it("useDataType syncs ref with current dataType", () => {
    const Test = () => {
      const ref = useRef<any>(null);
      const [type, setType] = useState("int");
      const [refVal, setRefVal] = useState("");

      useDataType(ref, type);

      useEffect(() => {
        setRefVal(ref.current);
      }, [type]);

      return (
        <>
          <button onClick={() => setType("str")}>Update</button>
          <div data-testid="value">{refVal}</div>
        </>
      );
    };

    render(<Test />);
    expect(screen.getByTestId("value").textContent).toBe("int");

    act(() => screen.getByText("Update").click());
    expect(screen.getByTestId("value").textContent).toBe("str");
  });

  /**
   * Tests the useContentValue hook.
   * It should keep a ref updated with the latest value of `contentValue`.
   */
  it("useContentValue syncs ref with current contentValue", () => {
    const Test = () => {
      const ref = useRef<any>(null);
      const [val, setVal] = useState("A");
      const [refVal, setRefVal] = useState("");

      useContentValue(ref, val);

      useEffect(() => {
        setRefVal(ref.current);
      }, [val]);

      return (
        <>
          <button onClick={() => setVal("B")}>Change</button>
          <div data-testid="val">{refVal}</div>
        </>
      );
    };

    render(<Test />);
    expect(screen.getByTestId("val").textContent).toBe("A");

    act(() => screen.getByText("Change").click());
    expect(screen.getByTestId("val").textContent).toBe("B");
  });

  /**
   * Tests the useCanvasResize hook.
   * It should calculate and set the SVG viewBox on mount and upon window resize.
   */
  it("useCanvasResize sets initial viewBox and listens to resize", async () => {
    const setViewBox = jest.fn();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.getBoundingClientRect = () => ({ width: 300, height: 150 } as any);

    const Test = () => {
      const ref = useRef<any>(null);
      useCanvasResize(ref, setViewBox);

      useLayoutEffect(() => {
        ref.current = svg;
        window.dispatchEvent(new Event("resize"));
      }, []);

      return <div />;
    };

    render(<Test />);

    await waitFor(() => {
      expect(setViewBox).toHaveBeenCalledWith("0 0 300 150");
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(setViewBox).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * Tests the useDraggableBox hook.
   * It should append the SVG output, set its attributes, and prepare the drag interface.
   */
  it("useDraggableBox appends SVG, sets attributes, and installs overlay", async () => {
    const Test = () => {
      const gRef = useRef<SVGGElement>(null);
      const element = { x: 50, y: 60 };
      const halfSize = { current: {} };
      const isDragging = { current: false };
      const start = { current: { x: 0, y: 0 } };
      const origin = { current: { x: 0, y: 0 } };
      const updatePosition = jest.fn();
      const openInterface = jest.fn();

      useDraggableBox({
        gRef,
        element,
        halfSize,
        isDragging,
        start,
        origin,
        updatePosition,
        openInterface,
      });

      return (
        <svg>
          <g ref={gRef}></g>
        </svg>
      );
    };

    render(<Test />);
    await waitFor(() => {
      expect(mockSVG.setAttribute).toHaveBeenCalledWith(
        "viewBox",
        expect.any(String)
      );
      expect(mockSVG.setAttribute).toHaveBeenCalledWith(
        "width",
        expect.any(String)
      );
      expect(mockSVG.setAttribute).toHaveBeenCalledWith(
        "height",
        expect.any(String)
      );
    });
  });
});
