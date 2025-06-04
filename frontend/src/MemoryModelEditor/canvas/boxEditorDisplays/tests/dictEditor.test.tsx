import { render, screen, fireEvent } from "@testing-library/react";
import DictEditor from "../dictEditor";

test("adds and saves dictionary entries with numeric keys and values", () => {
  const onSave = jest.fn();

  render(
    <DictEditor
      element={{
        id: "4",
        kind: {
          name: "dict",
          type: "dict",
          value: {},
        },
      }}
      onSave={onSave}
      onCancel={() => {}}
    />
  );

  // Click "+ Add" to create a new entry
  fireEvent.click(screen.getByText("+ Add"));

  // Change key and value inputs
  fireEvent.change(screen.getByPlaceholderText("key id"), {
    target: { value: "1" },
  });
  fireEvent.change(screen.getByPlaceholderText("value id"), {
    target: { value: "9" },
  });

  // Save the entry
  fireEvent.click(screen.getByText("Save"));

  expect(onSave).toHaveBeenCalledWith({
    name: "dict",
    type: "dict",
    value: { 1: 9 },
  });
});
