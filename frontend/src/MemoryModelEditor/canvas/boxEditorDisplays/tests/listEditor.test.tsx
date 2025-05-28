import { render, screen, fireEvent } from "@testing-library/react";
import ListEditor from "../listEditor";

test("adds and saves list of object ids", () => {
  const onSave = jest.fn();

  render(
    <ListEditor
      element={{
        id: "3",
        kind: {
          name: "list",
          type: "list",
          value: [],
        },
      }}
      onSave={onSave}
      onCancel={() => {}}
    />
  );

  fireEvent.click(screen.getByText("+ Add"));
  const input = screen.getByDisplayValue("0");
  fireEvent.change(input, { target: { value: "5" } });

  fireEvent.click(screen.getByText("Save"));

  expect(onSave).toHaveBeenCalledWith({
    name: "list",
    type: "list",
    value: [5],
  });
});
