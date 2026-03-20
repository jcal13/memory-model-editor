import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import FunctionNameSelector from "./FunctionNameSelector";

jest.mock("react-draggable", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("FunctionNameSelector", () => {
  it("filters the reserved __main__ name for non-main question frames and blocks adding it", async () => {
    const onAdd = jest.fn();
    const onSelect = jest.fn();

    render(
      <FunctionNameSelector
        names={["__main__", "helper"]}
        currentName="helper"
        onSelect={onSelect}
        onAdd={onAdd}
        onRemove={jest.fn()}
        editable={true}
        sandbox={true}
        canManageFunctions={true}
        reservedNames={["__main__"]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "helper" }));

    expect(
      screen.queryByRole("button", { name: "__main__" })
    ).not.toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: "helper" })).toHaveLength(2);

    await userEvent.type(screen.getByLabelText("Function name"), "__main__");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(
      screen.getByText("This function name is reserved for the question main frame")
    ).toBeInTheDocument();
  });

  it("renders the protected main frame name as read-only", () => {
    render(
      <FunctionNameSelector
        names={["__main__"]}
        currentName="__main__"
        onSelect={jest.fn()}
        onAdd={jest.fn()}
        onRemove={jest.fn()}
        editable={false}
        sandbox={true}
        canManageFunctions={true}
        reservedNames={["__main__"]}
      />
    );

    expect(screen.getByText("__main__")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "__main__" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /unassign/i })
    ).not.toBeInTheDocument();
  });
});
