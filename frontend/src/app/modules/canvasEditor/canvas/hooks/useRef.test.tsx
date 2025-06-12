import { renderHook } from "@testing-library/react";
import { useGlobalRefs, useCanvasRefs } from "./useRef";

/**
 * Test suite for the useGlobalRefs custom hook.
 * This hook manages references for dragging and positioning SVG <g> elements.
 */
describe("useGlobalRefs", () => {
  /**
   * Verifies that all refs are initialized correctly with the expected structure and default values.
   * - `gRef` should point to null initially.
   * - `isDragging` should default to false.
   * - `start`, `origin`, and `halfSize` should contain default coordinate objects.
   */
  it("initializes all refs with correct structure and default values", () => {
    const { result } = renderHook(() => useGlobalRefs());
    const refs = result.current;

    expect(refs).toHaveProperty("gRef");
    expect(refs).toHaveProperty("isDragging");
    expect(refs).toHaveProperty("start");
    expect(refs).toHaveProperty("origin");
    expect(refs).toHaveProperty("halfSize");

    expect(refs.gRef.current).toBe(null);
    expect(refs.isDragging.current).toBe(false);
    expect(refs.start.current).toEqual({ x: 0, y: 0 });
    expect(refs.origin.current).toEqual({ x: 0, y: 0 });
    expect(refs.halfSize.current).toEqual({ w: 0, h: 0 });
  });
});

/**
 * Test suite for the useCanvasRefs custom hook.
 * This hook provides references for the overall SVG canvas and an optional overlay layer.
 */
describe("useCanvasRefs", () => {
  /**
   * Verifies that both `svgRef` and `dragRef` are initialized to null.
   * These refs are used for managing the SVG canvas container and drag overlay.
   */
  it("initializes svgRef and dragRef as null", () => {
    const { result } = renderHook(() => useCanvasRefs());
    const refs = result.current;

    expect(refs).toHaveProperty("svgRef");
    expect(refs).toHaveProperty("dragRef");

    expect(refs.svgRef.current).toBe(null);
    expect(refs.dragRef.current).toBe(null);
  });
});
