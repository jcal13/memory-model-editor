import { render, screen, fireEvent } from "@testing-library/react";
import DictEditor from "../dictEditor";

test("adds and saves dictionary entries", () => {
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
      onRemove={() => {}}
    />
  );

  // Click "+ Add" to create a new entry
  fireEvent.click(screen.getByText("+ Add"));

  // Change key and id inputs
  fireEvent.change(screen.getByPlaceholderText("key"), {
    target: { value: "a" },
  });
  fireEvent.change(screen.getByPlaceholderText("id"), {
    target: { value: "9" },
  });

  // Save the entry
  fireEvent.click(screen.getByText("Save"));

  expect(onSave).toHaveBeenCalledWith({
    name: "dict",
    type: "dict",
    value: { a: 9 },
  });
});
