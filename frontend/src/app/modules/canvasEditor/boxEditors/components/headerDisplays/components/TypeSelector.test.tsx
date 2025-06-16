import React from "react";
import { render, fireEvent } from "@testing-library/react";
import TypeSelector from "./TypeSelector";

/**
 * Test suite for the TypeSelector component
 */
describe("TypeSelector", () => {
  const setDataTypeMock = jest.fn();
  const setValueMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Renders the dropdown with the correct selected value
   */
  it("renders select with correct initial value", () => {
    const { getByDisplayValue } = render(
      <TypeSelector
        dataType="float"
        setDataType={setDataTypeMock}
        value="3.14"
        setValue={setValueMock}
      />
    );

    expect(getByDisplayValue("float")).toBeInTheDocument();
  });

  /**
   * Updates value to "0" if int is selected and current value is invalid
   */
  it("resets invalid int value to '0' when int is selected", () => {
    const { getByDisplayValue } = render(
      <TypeSelector
        dataType="str"
        setDataType={setDataTypeMock}
        value="abc"
        setValue={setValueMock}
      />
    );

    fireEvent.change(getByDisplayValue("str"), {
      target: { value: "int" },
    });

    expect(setDataTypeMock).toHaveBeenCalledWith("int");
    expect(setValueMock).toHaveBeenCalledWith("0");
  });

  /**
   * Updates value to "0.0" if float is selected and current value is invalid
   */
  it("resets invalid float value to '0.0' when float is selected", () => {
    const { getByDisplayValue } = render(
      <TypeSelector
        dataType="str"
        setDataType={setDataTypeMock}
        value="xyz"
        setValue={setValueMock}
      />
    );

    fireEvent.change(getByDisplayValue("str"), {
      target: { value: "float" },
    });

    expect(setDataTypeMock).toHaveBeenCalledWith("float");
    expect(setValueMock).toHaveBeenCalledWith("0.0");
  });

  /**
   * Updates value to "true" when bool is selected
   */
  it("sets value to 'true' when bool is selected", () => {
    const { getByDisplayValue } = render(
      <TypeSelector
        dataType="int"
        setDataType={setDataTypeMock}
        value="5"
        setValue={setValueMock}
      />
    );

    fireEvent.change(getByDisplayValue("int"), {
      target: { value: "bool" },
    });

    expect(setDataTypeMock).toHaveBeenCalledWith("bool");
    expect(setValueMock).toHaveBeenCalledWith("true");
  });

  /**
   * Sets value to "None" when NoneType is selected
   */
  it("sets value to 'None' when None is selected", () => {
    const { getByDisplayValue } = render(
      <TypeSelector
        dataType="str"
        setDataType={setDataTypeMock}
        value="hello"
        setValue={setValueMock}
      />
    );

    fireEvent.change(getByDisplayValue("str"), {
      target: { value: "None" },
    });

    expect(setDataTypeMock).toHaveBeenCalledWith("None");
    expect(setValueMock).toHaveBeenCalledWith("None");
  });
});
