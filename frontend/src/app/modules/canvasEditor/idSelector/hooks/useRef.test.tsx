import { renderHook } from "@testing-library/react";
import { usePanelRefs } from "./useRef";

/**
 * Test suite for the usePanelRefs hook.
 */
describe("usePanelRefs", () => {
  /**
   * Returns a ref object with null as the initial value.
   */
  it("returns a ref object initialized to null", () => {
    const { result } = renderHook(() => usePanelRefs());
    expect(result.current.dragRef).toHaveProperty("current", null);
  });

  /**
   * Ref object persists across renders.
   */
  it("persists the same ref object across renders", () => {
    const { result, rerender } = renderHook(() => usePanelRefs());
    const initialRef = result.current.dragRef;

    rerender();

    expect(result.current.dragRef).toBe(initialRef);
  });
});
