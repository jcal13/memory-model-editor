import { renderHook, act } from "@testing-library/react";
import {
  useElementIdState,
  useGlobalStates,
  usePrimitiveStates,
  useFunctionStates,
  useCollectionSingleStates,
  useCollectionPairsStates,
} from "./useState";

/**
 * Test suite for the useElementIdState hook.
 */
describe("useElementIdState", () => {
  /**
   * Initializes with the provided element ID.
   */
  it("returns initial ID from element", () => {
    const { result } = renderHook(() => useElementIdState({ id: 1 }));
    const [elementId] = result.current;
    expect(elementId).toBe(1);
  });

  /**
   * Updates the ID when setElementId is called.
   */
  it("updates ID when setter is called", () => {
    const { result } = renderHook(() => useElementIdState({ id: 1 }));

    act(() => {
      const [, setElementId] = result.current;
      setElementId(2);
    });

    const [elementId] = result.current;
    expect(elementId).toBe(2);
  });
});

/**
 * Test suite for the useGlobalStates hook.
 */
describe("useGlobalStates", () => {
  /**
   * Initializes with hoverRemove set to false.
   */
  it("initializes hoverRemove as false", () => {
    const { result } = renderHook(() => useGlobalStates());
    expect(result.current.hoverRemove).toBe(false);
  });

  /**
   * Updates hoverRemove using the setter function.
   */
  it("updates hoverRemove when setHoverRemove is called", () => {
    const { result } = renderHook(() => useGlobalStates());
    act(() => result.current.setHoverRemove(true));
    expect(result.current.hoverRemove).toBe(true);
  });
});

/**
 * Test suite for the usePrimitiveStates hook.
 */
describe("usePrimitiveStates", () => {
  const mockElement = { kind: { type: "int", value: 42 } };

  /**
   * Initializes with the element's type and value.
   */
  it("initializes dataType and contentValue", () => {
    const { result } = renderHook(() => usePrimitiveStates(mockElement));
    const [dataType, , contentValue] = result.current;
    expect(dataType).toBe("int");
    expect(contentValue).toBe(42);
  });
});

/**
 * Test suite for the useFunctionStates hook.
 */
describe("useFunctionStates", () => {
  const mockElement = {
    kind: {
      functionName: "myFunc",
      params: [{ name: "x", target: 99 }],
    },
  };

  /**
   * Initializes with the function's name and parameters.
   */
  it("initializes functionName and functionParams", () => {
    const { result } = renderHook(() => useFunctionStates(mockElement));
    const [name, , params] = result.current;
    expect(name).toBe("myFunc");
    expect(params).toEqual([{ name: "x", target: 99 }]);
  });
});

/**
 * Test suite for the useCollectionSingleStates hook.
 */
describe("useCollectionSingleStates", () => {
  const mockElement = { kind: { value: [1, 2, 3] } };

  /**
   * Initializes with a flat collection array (e.g., list, tuple, or set).
   */
  it("initializes collectionSingles from element value", () => {
    const { result } = renderHook(() => useCollectionSingleStates(mockElement));
    expect(result.current[0]).toEqual([1, 2, 3]);
  });
});

/**
 * Test suite for the useCollectionPairsStates hook.
 */
describe("useCollectionPairsStates", () => {
  const mockElement = { kind: { value: { a: 1, b: 2 } } };

  /**
   * Initializes with key-value pairs from a dictionary.
   */
  it("initializes collectionPairs as object entries", () => {
    const { result } = renderHook(() => useCollectionPairsStates(mockElement));
    expect(result.current[0]).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });
});
