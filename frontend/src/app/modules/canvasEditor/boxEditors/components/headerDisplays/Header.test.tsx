import React from "react";
import { render } from "@testing-library/react";
import Header from "./Header";

/**
 * Test suite for the Header component
 */
describe("Header", () => {
  const baseProps = {
    dataType: "int",
    setDataType: jest.fn(),
    value: "123",
    setValue: jest.fn(),
    functionName: "foo",
    setFunctionName: jest.fn(),
    ids: [1, 2, 3],
    addId: jest.fn(),
    ownId: 1,
    setElementId: jest.fn(),
    removeId: jest.fn(),
  };

  /**
   * Renders PrimitiveHeader for primitive type
   */
  it("renders PrimitiveHeader for primitive kind", () => {
    const { getByTestId } = render(
      <Header
        {...baseProps}
        element={{ kind: { name: "primitive", type: "int" }, id: 1 }}
      />
    );

    expect(getByTestId("primitive-header")).toBeInTheDocument();
  });

  /**
   * Renders FunctionHeader for function type
   */
  it("renders FunctionHeader for function kind", () => {
    const { getByTestId } = render(
      <Header
        {...baseProps}
        element={{ kind: { name: "function", type: "function" }, id: 1 }}
      />
    );

    expect(getByTestId("function-header")).toBeInTheDocument();
  });

  /**
   * Renders CollectionHeader for collection types
   */
  it("renders CollectionHeader for collection kinds", () => {
    const collectionKinds = ["list", "set", "tuple", "dict"];
    for (const kind of collectionKinds) {
      const { getByTestId, unmount } = render(
        <Header
          {...baseProps}
          element={{ kind: { name: kind, type: kind }, id: 1 }}
        />
      );

      expect(getByTestId("collection-header")).toBeInTheDocument();
      unmount(); // Clean up between kinds
    }
  });
});
