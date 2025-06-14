import React, { useState } from "react";
import { render, fireEvent } from "@testing-library/react";
import PrimitiveContent from "./PrimitiveContent";

/**
 * Test wrapper that simulates state updates
 */
const PrimitiveWrapper = ({
  dataType,
  initialValue,
}: {
  dataType: any;
  initialValue: string;
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <PrimitiveContent dataType={dataType} value={value} setValue={setValue} />
  );
};

describe("PrimitiveContent", () => {
  /**
   * Renders input for float type and shows validation error if invalid
   */
  it("renders input for float type and shows validation error if invalid", () => {
    const { getByPlaceholderText, getByText } = render(
      <PrimitiveWrapper dataType="float" initialValue="123" />
    );

    const input = getByPlaceholderText("value");
    fireEvent.change(input, { target: { value: "bad" } });

    expect(getByText("Invalid float value")).toBeInTheDocument();
  });

  /**
   * Shows validation message for invalid int
   */
  it("shows validation message for invalid int", () => {
    const { getByText } = render(
      <PrimitiveWrapper dataType="int" initialValue="notanint" />
    );

    expect(getByText("Invalid int value")).toBeInTheDocument();
  });

  /**
   * Renders radio buttons for bool and updates value
   */
  it("renders radio buttons for bool and updates value", () => {
    const { getByLabelText } = render(
      <PrimitiveWrapper dataType="bool" initialValue="false" />
    );

    const trueRadio = getByLabelText("true");
    fireEvent.click(trueRadio);

    expect((trueRadio as HTMLInputElement).checked).toBe(true);
  });

  /**
   * Renders "None" for NoneType
   */
  it('renders "None" for NoneType', () => {
    const { getByText } = render(
      <PrimitiveWrapper dataType="None" initialValue="None" />
    );

    expect(getByText("None")).toBeInTheDocument();
  });
});
