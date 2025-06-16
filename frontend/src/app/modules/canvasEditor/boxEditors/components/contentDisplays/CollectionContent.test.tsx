import React from "react";
import { render, fireEvent } from "@testing-library/react";
import CollectionContent from "./CollectionContent";

// Mocks CollectionItem and CollectionAddButton to track structure and interaction
jest.mock("./components/CollectionItem", () => ({
  __esModule: true,
  default: ({ mode }: { mode: string }) => (
    <div data-testid={`mock-collection-item-${mode}`} />
  ),
}));

jest.mock("./components/CollectionAddButton", () => ({
  __esModule: true,
  default: ({ mode, setItems }: any) => (
    <button
      data-testid={`mock-add-button-${mode}`}
      onClick={() =>
        setItems((prev: any[]) =>
          mode === "single" ? [...prev, "new"] : [...prev, ["newKey", "newVal"]]
        )
      }
    >
      Add
    </button>
  ),
}));

/**
 * Test suite for the <CollectionContent /> component
 */
describe("CollectionContent", () => {
  const ids = ["id1", "id2"];
  const addId = jest.fn();
  const removeId = jest.fn();

  /**
   * Renders correctly in "single" mode with mocked CollectionItem and AddButton
   */
  it("renders item and button in single mode", () => {
    const { getByTestId } = render(
      <CollectionContent
        mode="single"
        items={["a", "b"]}
        setItems={jest.fn()}
        ids={ids}
        addId={addId}
        removeId={removeId}
      />
    );
    expect(getByTestId("mock-collection-item-single")).toBeInTheDocument();
    expect(getByTestId("mock-add-button-single")).toBeInTheDocument();
  });

  /**
   * Renders correctly in "pair" mode with mocked CollectionItem and AddButton
   */
  it("renders item and button in pair mode", () => {
    const { getByTestId } = render(
      <CollectionContent
        mode="pair"
        items={[["key1", "val1"]]}
        setItems={jest.fn()}
        ids={ids}
        addId={addId}
        removeId={removeId}
      />
    );
    expect(getByTestId("mock-collection-item-pair")).toBeInTheDocument();
    expect(getByTestId("mock-add-button-pair")).toBeInTheDocument();
  });

  /**
   * Clicking the Add button triggers item state update logic
   */
  it("calls setItems with new entry on Add click", () => {
    const setItems = jest.fn(
      (updater) => updater(["existing"]) // simulate state update
    );

    const { getByTestId } = render(
      <CollectionContent
        mode="single"
        items={["existing"]}
        setItems={setItems}
        ids={ids}
        addId={addId}
        removeId={removeId}
      />
    );

    fireEvent.click(getByTestId("mock-add-button-single"));
    expect(setItems).toHaveBeenCalled();
  });
});
