import React from "react";
import { render } from "@testing-library/react";
import FunctionHeader from "./FunctionHeader";

// Mock the FunctionName component
jest.mock("./components/FunctionName", () => ({
  __esModule: true,
  default: ({ functionName }: { functionName: string }) => (
    <div data-testid="function-name">{functionName}</div>
  ),
}));

/**
 * Test suite for the FunctionHeader component
 */
describe("FunctionHeader", () => {
  const mockSetFunctionName = jest.fn();

  /**
   * Renders FunctionName with the correct props
   */
  it("renders FunctionName with correct function name", () => {
    const { getByTestId } = render(
      <FunctionHeader
        functionName="myFunction"
        setFunctionName={mockSetFunctionName}
      />
    );

    const nameDisplay = getByTestId("function-name");
    expect(nameDisplay).toBeInTheDocument();
    expect(nameDisplay).toHaveTextContent("myFunction");
  });
});
