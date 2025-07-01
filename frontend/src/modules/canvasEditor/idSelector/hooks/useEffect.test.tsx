import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import { useIdListSync } from "./useEffect";

/**
 * Test suite for the useIdListSync hook.
 */
describe("useIdListSync", () => {
  /**
   * Initializes the local state to match the source array on mount.
   */
  it("initializes local state from source", () => {
    const source = [1, 2, 3];

    const { result } = renderHook(() => {
      const [local, setLocal] = useState<number[]>([]);
      useIdListSync(source, setLocal);
      return local;
    });

    expect(result.current).toEqual([1, 2, 3]);
  });

  /**
   * Updates the local state when the source changes.
   */
  it("updates local state when source changes", () => {
    let currentSource = [1, 2, 3];

    const { result, rerender } = renderHook(
      ({ source }) => {
        const [local, setLocal] = useState<number[]>([]);
        useIdListSync(source, setLocal);
        return local;
      },
      {
        initialProps: { source: currentSource },
      }
    );

    expect(result.current).toEqual([1, 2, 3]);

    // Update source and rerender
    currentSource = [4, 5];
    rerender({ source: currentSource });

    expect(result.current).toEqual([4, 5]);
  });
});
