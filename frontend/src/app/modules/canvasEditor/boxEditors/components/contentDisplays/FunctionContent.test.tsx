import React from "react";
import { render, fireEvent } from "@testing-library/react";
import FunctionContent from "./FunctionContent";

/**
 * Test suite for the FunctionContent component
 */
describe("FunctionContent", () => {
  const defaultParams = [{ name: "x", targetId: null }];
  const setParamsMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Renders existing parameters and input fields correctly
   */
  it("renders input field for each parameter", () => {
    const { getByPlaceholderText } = render(
      <FunctionContent
        functionParams={defaultParams}
        setParams={setParamsMock}
        ids={[]}
        addId={() => {}}
      />
    );
    expect(getByPlaceholderText("var")).toBeInTheDocument();
  });

  /**
   * Calls setParams with updated name when input changes
   */
  it("calls setParams when parameter name is changed", () => {
    const { getByPlaceholderText } = render(
      <FunctionContent
        functionParams={defaultParams}
        setParams={setParamsMock}
        ids={[]}
        addId={() => {}}
      />
    );
    const input = getByPlaceholderText("var");
    fireEvent.change(input, { target: { value: "y" } });

    expect(setParamsMock).toHaveBeenCalledWith([{ name: "y", targetId: null }]);
  });

  /**
   * Removes the correct parameter when delete button is clicked
   */
  it("calls setParams to remove a parameter when × is clicked", () => {
    const { getByText } = render(
      <FunctionContent
        functionParams={defaultParams}
        setParams={setParamsMock}
        ids={[]}
        addId={() => {}}
      />
    );
    fireEvent.click(getByText("×"));
    expect(setParamsMock).toHaveBeenCalledWith([]);
  });

  /**
   * Adds a new parameter when 'Add Variable' is clicked
   */
  it("adds a new empty parameter on Add Variable click", () => {
    const { getByText } = render(
      <FunctionContent
        functionParams={defaultParams}
        setParams={setParamsMock}
        ids={[]}
        addId={() => {}}
      />
    );
    fireEvent.click(getByText("Add Variable"));
    expect(setParamsMock).toHaveBeenCalledWith([
      ...defaultParams,
      { name: "", targetId: null },
    ]);
  });
});
