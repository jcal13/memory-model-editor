import React, { useState } from "react";
import { render, fireEvent } from "@testing-library/react";
import FunctionName from "./FunctionName";

/**
 * Wrapper component to simulate stateful behavior for controlled input.
 */
const FunctionNameWrapper = ({ initialValue = "" }) => {
  const [functionName, setFunctionName] = useState(initialValue);
  return (
    <FunctionName
      functionName={functionName}
      setFunctionName={setFunctionName}
    />
  );
};

/**
 * Test suite for the FunctionName component
 */
describe("FunctionName", () => {
  /**
   * Renders input with initial value and updates on user input
   */
  it("renders input with initial value and updates when typing", () => {
    const { getByPlaceholderText } = render(
      <FunctionNameWrapper initialValue="myFunc" />
    );

    const input = getByPlaceholderText("function name") as HTMLInputElement;

    // Initial value is rendered correctly
    expect(input.value).toBe("myFunc");

    // Simulate user typing
    fireEvent.change(input, { target: { value: "updatedFunc" } });

    // Updated value appears in the input
    expect(input.value).toBe("updatedFunc");
  });

  /**
   * Supports empty initial value and sets name correctly
   */
  it("renders with empty input and sets name on change", () => {
    const { getByPlaceholderText } = render(
      <FunctionNameWrapper initialValue="" />
    );

    const input = getByPlaceholderText("function name") as HTMLInputElement;

    // Input starts empty
    expect(input.value).toBe("");

    // User types into input
    fireEvent.change(input, { target: { value: "newFunc" } });

    // Input updates
    expect(input.value).toBe("newFunc");
  });
});
