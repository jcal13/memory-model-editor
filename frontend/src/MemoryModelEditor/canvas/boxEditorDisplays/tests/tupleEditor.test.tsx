import { render, screen, fireEvent } from "@testing-library/react";
import TupleEditor from "../tupleEditor";

test("adds and saves tuple of object ids", () => {
  const onSave = jest.fn();

  render(
    <TupleEditor
      element={{
        id: "5",
        kind: {
          name: "tuple",
          type: "tuple",
          value: [],
        },
      }}
      onSave={onSave}
      onCancel={() => {}}
      onRemove={() => {}}
    />
  );

  fireEvent.click(screen.getByText("+ Add"));
  const input = screen.getByDisplayValue("0");
  fireEvent.change(input, { target: { value: "4" } });

  fireEvent.click(screen.getByText("Save"));

  expect(onSave).toHaveBeenCalledWith({
    name: "tuple",
    type: "tuple",
    value: [4],
  });
});
