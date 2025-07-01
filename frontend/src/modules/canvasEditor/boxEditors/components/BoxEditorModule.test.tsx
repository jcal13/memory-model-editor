import React from "react";
import { render } from "@testing-library/react";
import BoxEditorModule from "./BoxEditorModule";
import { BoxEditorType } from "../../shared/types";

/**
 * Mocks for internal hooks and subcomponents
 */
jest.mock("../hooks/useEffect", () => ({
  useModule: jest.fn(),
}));
jest.mock("../hooks/useState", () => ({
  useGlobalStates: () => ({
    hoverRemove: false,
    setHoverRemove: jest.fn(),
  }),
  useElementIdState: () => [1, jest.fn()],
  usePrimitiveStates: () => ["int", jest.fn(), "123", jest.fn()],
  useFunctionStates: () => ["func", jest.fn(), [], jest.fn()],
  useCollectionSingleStates: () => [[], jest.fn()],
  useCollectionPairsStates: () => [[], jest.fn()],
}));
jest.mock("../hooks/useRef", () => ({
  useGlobalRefs: () => React.createRef(),
}));

jest.mock("./headerDisplays/Header", () => () => (
  <div data-testid="mock-header" />
));
jest.mock("./contentDisplays/Content", () => () => (
  <div data-testid="mock-content" />
));
jest.mock("./buttonDisplays/RemoveButton", () => () => (
  <div data-testid="mock-remove-button" />
));

/**
 * Test suite for the BoxEditorModule component
 */
describe("BoxEditorModule", () => {
  const baseProps: BoxEditorType = {
    metadata: {
      id: 1,
      kind: { name: "primitive", type: "int", value: "123" },
    },
    onSave: jest.fn(),
    onRemove: jest.fn(),
    onClose: jest.fn(),
    ids: [1, 2, 3],
    addId: jest.fn(),
    removeId: jest.fn(),
  };

  /**
   * Renders without crashing and shows all major sections
   */
  it("renders header, content, and remove button sections", () => {
    const { getByTestId } = render(<BoxEditorModule {...baseProps} />);

    expect(getByTestId("mock-header")).toBeInTheDocument();
    expect(getByTestId("mock-content")).toBeInTheDocument();
    expect(getByTestId("mock-remove-button")).toBeInTheDocument();
  });

  /**
   * Applies the correct root styles and class names
   */
  it("applies drag-handle and editor module styles", () => {
    const { container } = render(<BoxEditorModule {...baseProps} />);
    const rootDiv = container.querySelector("div");

    expect(rootDiv?.classList.contains("drag-handle")).toBe(true);
    expect(rootDiv?.className).toContain("boxEditorModule");
  });
});
