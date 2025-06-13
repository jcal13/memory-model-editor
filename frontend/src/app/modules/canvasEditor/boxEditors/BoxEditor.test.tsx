import { render } from "@testing-library/react";
import BoxEditor from "./BoxEditor";
import BoxEditorModule from "./components/BoxEditorModule";
import React from "react";
import { BoxEditorType } from "../shared/types";

// Mock the BoxEditorModule to isolate BoxEditor behavior
jest.mock("./components/BoxEditorModule", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-box-editor-module" />),
}));

/**
 * Test suite for the BoxEditor component.
 */
describe("BoxEditor", () => {
  const mockProps: BoxEditorType = {
    metadata: {
      id: 1,
      kind: {
        name: "primitive",
        type: "int",
        value: "42",
      },
    },
    onSave: jest.fn(),
    onRemove: jest.fn(),
    ids: [1, 2, 3],
    addId: jest.fn(),
    removeId: jest.fn(),
  };

  beforeEach(() => {
    (BoxEditorModule as jest.Mock).mockClear(); // Reset call history
  });

  /**
   * Renders the BoxEditor component without crashing.
   */
  it("renders BoxEditorModule internally", () => {
    const { getByTestId } = render(<BoxEditor {...mockProps} />);
    expect(getByTestId("mock-box-editor-module")).toBeInTheDocument();
  });

  /**
   * Passes all props correctly to BoxEditorModule.
   */
  it("forwards props to BoxEditorModule", () => {
    render(<BoxEditor {...mockProps} />);
    const lastCall = (BoxEditorModule as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[0]).toEqual(
      expect.objectContaining({
        metadata: mockProps.metadata,
        onSave: mockProps.onSave,
        onRemove: mockProps.onRemove,
        ids: mockProps.ids,
        addId: mockProps.addId,
        removeId: mockProps.removeId,
      })
    );
  });
});
