import { render, screen, fireEvent } from "@testing-library/react";
import FunctionEditor from "../functionEditor";

test("adds and saves function name and parameters", () => {
  const onSave = jest.fn();

  render(
    <FunctionEditor
      element={{
        id: "7",
        kind: {
          name: "function",
          type: "function",
          value: null,
          functionName: "",
          params: [],
        },
      }}
      onSave={onSave}
      onCancel={() => {}}
    />
  );

  fireEvent.change(screen.getByPlaceholderText("Function name"), {
    target: { value: "myFunc" },
  });

  fireEvent.click(screen.getByText("+ Add Variable"));

  fireEvent.change(screen.getByPlaceholderText("param name"), {
    target: { value: "x" },
  });

  fireEvent.change(screen.getByPlaceholderText("target id"), {
    target: { value: "5" },
  });

  fireEvent.click(screen.getByText("Save"));

  expect(onSave).toHaveBeenCalledWith({
    name: "function",
    type: "function",
    value: null,
    functionName: "myFunc",
    params: [{ name: "x", targetId: 5 }],
  });
});
