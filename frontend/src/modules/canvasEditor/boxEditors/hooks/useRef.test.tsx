import { renderHook } from "@testing-library/react";
import { useGlobalRefs } from "./useRef";

/**
 * Test suite for the useGlobalRefs hook.
 */
describe("useGlobalRefs", () => {
  /**
   * Returns a ref object pointing to null initially
   */
  it("returns a ref object", () => {
    const { result } = renderHook(() => useGlobalRefs());
    expect(result.current).toHaveProperty("current", null);
  });

  /**
   * Maintains the same ref object across renders
   */
  it("maintains the same ref on re-render", () => {
    const { result, rerender } = renderHook(() => useGlobalRefs());
    const firstRef = result.current;
    rerender();
    expect(result.current).toBe(firstRef);
  });
});
