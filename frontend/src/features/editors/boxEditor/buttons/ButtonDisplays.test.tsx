import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ButtonDisplays from "./ButtonDisplays";

describe("ButtonDisplays", () => {
  it("disables remove and invalidate actions for the protected main frame", async () => {
    const onSave = jest.fn();
    const onRemove = jest.fn();
    const onToggleInvalidate = jest.fn();

    render(
      <ButtonDisplays
        element={{
          id: "_",
          kind: {
            name: "function",
            type: "function",
          },
        }}
        onSave={onSave}
        onToggleInvalidate={onToggleInvalidate}
        invalidated={false}
        onRemove={onRemove}
        dataType="function"
        value=""
        hoverRemove={false}
        setHoverRemove={jest.fn()}
        functionName="__main__"
        functionParams={[]}
        items={[]}
        disableRemove={true}
        disableInvalidate={true}
      />
    );

    const invalidateButton = screen.getByRole("button", {
      name: "Invalidate",
    });
    const removeButton = screen.getByRole("button", {
      name: "Remove Box",
    });

    expect(invalidateButton).toBeDisabled();
    expect(removeButton).toBeDisabled();

    userEvent.click(invalidateButton);
    userEvent.click(removeButton);

    expect(onToggleInvalidate).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });
});
