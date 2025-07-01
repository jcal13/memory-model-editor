import { renderHook } from "@testing-library/react";
import { usePanelRef } from "./useRef";

/**
 * Test suite for the usePanelRef hook.
 */
describe("usePanelRef", () => {
  /**
   * It should return a ref object whose current value is initially null.
   */
  it("returns a ref object initialized to null", () => {
    const { result } = renderHook(() => usePanelRef());
    expect(result.current).toHaveProperty("current", null);
  });

  /**
   * The same ref object should persist across renders.
   */
  it("persists the same ref object across renders", () => {
    const { result, rerender } = renderHook(() => usePanelRef());
    const initialRef = result.current;

    rerender();

    expect(result.current).toBe(initialRef);
  });
});
