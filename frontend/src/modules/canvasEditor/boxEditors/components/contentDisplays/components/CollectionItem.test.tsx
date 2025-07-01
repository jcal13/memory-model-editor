import React from "react";
import { render, fireEvent } from "@testing-library/react";
import CollectionItem from "./CollectionItem";

// Mocks the IdSelector component to simplify testing interactions
jest.mock("../../../../idSelector/IdSelector", () => ({
  __esModule: true,
  default: ({ currentId, onSelect, onAdd, onRemove, buttonClassName }: any) => (
    <div data-testid={`id-selector-${currentId}`} className={buttonClassName}>
      <button onClick={() => onSelect("updated")}>Select</button>
      <button onClick={() => onAdd("new")}>Add</button>
      <button onClick={() => onRemove(currentId)}>Remove</button>
    </div>
  ),
}));

/**
 * Test suite for the <CollectionItem /> component
 */
describe("CollectionItem", () => {
  const ids = ["a", "b", "c"];
  const addId = jest.fn();
  const removeId = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Renders nothing when items array is empty
   */
  it("returns null when items are empty", () => {
    const { container } = render(
      <CollectionItem
        mode="single"
        items={[]}
        setItems={() => {}}
        ids={ids}
        addId={addId}
        removeId={removeId}
        sandbox={true}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  /**
   * Renders list/set/tuple items in single mode with correct structure
   */
  it("renders single mode items correctly", () => {
    const { getByTestId } = render(
      <CollectionItem
        mode="single"
        items={["x", "y"]}
        setItems={() => {}}
        ids={ids}
        addId={addId}
        removeId={removeId}
        sandbox={true}
      />
    );
    expect(getByTestId("id-selector-x")).toBeInTheDocument();
    expect(getByTestId("id-selector-y")).toBeInTheDocument();
  });

  /**
   * Updates item in single mode on selection
   */
  it("calls setItems with updated value in single mode", () => {
    const setItems = jest.fn();
    const { getAllByText } = render(
      <CollectionItem
        mode="single"
        items={["x", "y"]}
        setItems={setItems}
        ids={ids}
        addId={addId}
        removeId={removeId}
        sandbox={true}
      />
    );

    // Simulate selecting new ID for index 0
    fireEvent.click(getAllByText("Select")[0]);
    expect(setItems).toHaveBeenCalledWith(expect.any(Function));

    // Simulate removing index 1
    fireEvent.click(getAllByText("×")[1]);
    expect(setItems).toHaveBeenCalledWith(expect.any(Function));
  });

  /**
   * Renders key-value pairs correctly in pair mode
   */
  it("renders dict-style pairs in pair mode", () => {
    const { getByTestId } = render(
      <CollectionItem
        mode="pair"
        items={[["k1", "v1"]]}
        setItems={() => {}}
        ids={ids}
        addId={addId}
        removeId={removeId}
        sandbox={true}
      />
    );
    expect(getByTestId("id-selector-k1")).toBeInTheDocument();
    expect(getByTestId("id-selector-v1")).toBeInTheDocument();
  });

  /**
   * Updates key or value in pair mode on selection
   */
  it("updates pair key or value when selected", () => {
    const setItems = jest.fn();
    const { getAllByText } = render(
      <CollectionItem
        mode="pair"
        items={[["k", "v"]]}
        setItems={setItems}
        ids={ids}
        addId={addId}
        removeId={removeId}
        sandbox={true}
      />
    );

    // Select new key
    fireEvent.click(getAllByText("Select")[0]);
    expect(setItems).toHaveBeenCalledWith(expect.any(Function));

    // Select new value
    fireEvent.click(getAllByText("Select")[1]);
    expect(setItems).toHaveBeenCalledWith(expect.any(Function));

    // Remove the pair
    fireEvent.click(getAllByText("×")[0]);
    expect(setItems).toHaveBeenCalledWith(expect.any(Function));
  });
});
