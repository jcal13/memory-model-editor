import React from "react";
import { render } from "@testing-library/react";
import CollectionHeader from "./CollectionHeader";

// Mock the child components
jest.mock("./components/IdDisplay", () => () => (
  <div data-testid="id-display" />
));
jest.mock(
  "./components/TypeDisplay",
  () =>
    ({ typeLabel }: { typeLabel: string }) =>
      <div data-testid="type-display">{typeLabel}</div>
);

/**
 * Test suite for the CollectionHeader component
 */
describe("CollectionHeader", () => {
  const mockElement = {
    kind: {
      type: "list",
    },
  };

  const mockIds = [1, 2, 3];
  const mockAddId = jest.fn();
  const mockRemoveId = jest.fn();
  const mockSetElementId = jest.fn();
  const mockOwnId = 1;

  /**
   * Renders IdDisplay and TypeDisplay with correct props
   */
  it("renders IdDisplay and TypeDisplay", () => {
    const { getByTestId } = render(
      <CollectionHeader
        element={mockElement}
        ids={mockIds}
        addId={mockAddId}
        removeId={mockRemoveId}
        ownId={mockOwnId}
        setElementId={mockSetElementId}
      />
    );

    expect(getByTestId("id-display")).toBeInTheDocument();
    expect(getByTestId("type-display")).toBeInTheDocument();
    expect(getByTestId("type-display")).toHaveTextContent("list");
  });
});
