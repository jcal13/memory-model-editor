import { render, screen, fireEvent } from "@testing-library/react";
import SetEditor from "../setEditor";

test("adds and saves set of object ids", () => {
  const onSave = jest.fn();

  render(
    <SetEditor
      element={{
        id: "6",
        kind: {
          name: "set",
          type: "set",
          value: [],
        },
      }}
      onSave={onSave}
      onCancel={() => {}}
    />
  );

  fireEvent.click(screen.getByText("+ Add"));
  const input = screen.getByDisplayValue("0");
  fireEvent.change(input, { target: { value: "12" } });

  fireEvent.click(screen.getByText("Save"));

  expect(onSave).toHaveBeenCalledWith({
    name: "set",
    type: "set",
    value: [12],
  });
});
