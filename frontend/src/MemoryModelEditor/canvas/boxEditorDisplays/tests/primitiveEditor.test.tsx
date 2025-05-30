import { render, screen, fireEvent } from "@testing-library/react";
import PrimitiveEditor from "../primitiveEditor";

test("saves valid int primitive", () => {
  const onSave = jest.fn();
  const onCancel = jest.fn();

  render(
    <PrimitiveEditor
      element={{ id: "1", kind: { name: "primitive", type: "int", value: "42" } }}
      onSave={onSave}
      onCancel={onCancel}
    />
  );

  fireEvent.change(screen.getByPlaceholderText("value"), { target: { value: "99" } });
  fireEvent.click(screen.getByText("Save"));

  expect(onSave).toHaveBeenCalledWith({
    name: "primitive",
    type: "int",
    value: "99",
  });
});
