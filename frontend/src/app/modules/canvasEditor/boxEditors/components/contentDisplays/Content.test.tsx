import React from "react";
import { render } from "@testing-library/react";
import Content from "./Content";

// Mock the internal editor components used by Content
jest.mock("./PrimitiveContent", () => ({
  __esModule: true,
  default: () => <div data-testid="primitive-editor" />,
}));

jest.mock("./FunctionContent", () => ({
  __esModule: true,
  default: () => <div data-testid="function-editor" />,
}));

jest.mock("./CollectionContent", () => ({
  __esModule: true,
  default: ({ mode }: { mode: string }) => (
    <div data-testid={`collection-editor-${mode}`} />
  ),
}));

/**
 * Test suite for the <Content /> component
 */
describe("Content", () => {
  const ids = ["id1", "id2"];
  const addId = jest.fn();
  const removeId = jest.fn();

  const baseProps = {
    dataType: "int",
    value: "42",
    setValue: jest.fn(),
    functionParams: [],
    setFunctionParams: jest.fn(),
    collectionItems: [],
    setCollectionItems: jest.fn(),
    collectionPairs: [],
    setCollectionPairs: jest.fn(),
    ids,
    addId,
    removeId,
  };

  /**
   * Renders the primitive editor when kind is 'primitive'
   */
  it("renders PrimitiveContent for primitive kind", () => {
    const metadata = { kind: { name: "primitive" } };
    const { getByTestId } = render(
      <Content {...baseProps} metadata={metadata} />
    );
    expect(getByTestId("primitive-editor")).toBeInTheDocument();
  });

  /**
   * Renders the function editor when kind is 'function'
   */
  it("renders FunctionContent for function kind", () => {
    const metadata = { kind: { name: "function" } };
    const { getByTestId } = render(
      <Content {...baseProps} metadata={metadata} />
    );
    expect(getByTestId("function-editor")).toBeInTheDocument();
  });

  /**
   * Renders CollectionContent in single mode for list/set/tuple kinds
   */
  ["list", "set", "tuple"].forEach((type) => {
    it(`renders CollectionContent in single mode for ${type} kind`, () => {
      const metadata = { kind: { name: type } };
      const { getByTestId } = render(
        <Content {...baseProps} metadata={metadata} />
      );
      expect(getByTestId("collection-editor-single")).toBeInTheDocument();
    });
  });

  /**
   * Renders CollectionContent in pair mode for dict kind
   */
  it("renders CollectionContent in pair mode for dict kind", () => {
    const metadata = { kind: { name: "dict" } };
    const { getByTestId } = render(
      <Content {...baseProps} metadata={metadata} />
    );
    expect(getByTestId("collection-editor-pair")).toBeInTheDocument();
  });

  /**
   * Returns null when kind is unsupported
   */
  it("renders nothing for unsupported kind", () => {
    const metadata = { kind: { name: "unsupported" } };
    const { container } = render(
      <Content {...baseProps} metadata={metadata} />
    );
    expect(container.firstChild).toBeNull();
  });
});
