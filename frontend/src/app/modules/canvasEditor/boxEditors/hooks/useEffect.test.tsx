import React, { useRef, useState } from "react";
import { render, fireEvent } from "@testing-library/react";
import { useModule } from "./useEffect";

/**
 * Mock wrapper to test the useModule hook.
 */
const TestModule = ({ element, onSave }: any) => {
  const moduleRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({
    dataType: "int",
    contentValue: "123",
    functionName: "foo",
    params: [{ name: "x", targetId: 1 }],
    collectionItems: [["key", "value"]],
  });

  useModule(
    moduleRef,
    onSave,
    element,
    99,
    state.dataType,
    state.contentValue,
    state.functionName,
    state.params,
    state.collectionItems
  );

  return <div ref={moduleRef}>Editor Box</div>;
};

/**
 * Test suite for the useModule hook.
 */
describe("useModule", () => {
  const onSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Saves primitive type on outside click
   */
  it("calls onSave with primitive data when clicking outside", () => {
    const element = { kind: { name: "primitive", type: "int" } };

    render(
      <>
        <TestModule element={element} onSave={onSave} />
        <div data-testid="outside">Outside</div>
      </>
    );

    fireEvent.mouseDown(document.querySelector('[data-testid="outside"]')!);
    expect(onSave).toHaveBeenCalledWith(99, {
      name: "primitive",
      type: "int",
      value: "123",
    });
  });

  /**
   * Saves function type on outside click
   */
  it("calls onSave with function data when clicking outside", () => {
    const element = { kind: { name: "function", type: "function" } };

    render(
      <>
        <TestModule element={element} onSave={onSave} />
        <div data-testid="outside">Outside</div>
      </>
    );

    fireEvent.mouseDown(document.querySelector('[data-testid="outside"]')!);
    expect(onSave).toHaveBeenCalledWith(99, {
      name: "function",
      type: "function",
      value: null,
      functionName: "foo",
      params: [{ name: "x", targetId: 1 }],
    });
  });

  /**
   * Saves dict data as object on outside click
   */
  it("calls onSave with dict data", () => {
    const element = { kind: { name: "dict", type: "dict" } };

    render(
      <>
        <TestModule element={element} onSave={onSave} />
        <div data-testid="outside">Outside</div>
      </>
    );

    fireEvent.mouseDown(document.querySelector('[data-testid="outside"]')!);
    expect(onSave).toHaveBeenCalledWith(99, {
      name: "dict",
      type: "dict",
      value: { key: "value" },
    });
  });

  /**
   * Skips save when clicking inside the editor
   */
  it("does not call onSave when clicking inside the module", () => {
    const element = { kind: { name: "primitive", type: "int" } };

    const { getByText } = render(
      <>
        <TestModule element={element} onSave={onSave} />
      </>
    );

    fireEvent.mouseDown(getByText("Editor Box"));
    expect(onSave).not.toHaveBeenCalled();
  });
});
