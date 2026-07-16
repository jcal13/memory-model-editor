import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import CallStack from "./CallStack";

function renderCallStack(
  overrides: Partial<React.ComponentProps<typeof CallStack>> = {}
) {
  return render(
    <svg>
      <CallStack
        frames={[]}
        selected={null}
        onSelect={jest.fn()}
        onReorder={jest.fn()}
        {...overrides}
      />
    </svg>
  );
}

describe("CallStack help icon", () => {
  it("shows a help icon labelled for the MemoryViz 'Call Stack' title", () => {
    renderCallStack({ visualStyle: "memoryviz" });

    expect(
      screen.getByRole("button", { name: "Help: Call Stack" })
    ).toBeInTheDocument();
  });

  it("shows a help icon labelled for the Python Tutor 'Frames' title", () => {
    renderCallStack({ visualStyle: "pythonTutor" });

    expect(
      screen.getByRole("button", { name: "Help: Frames" })
    ).toBeInTheDocument();
  });

  it("opens a dialog explaining the call stack on click", () => {
    renderCallStack({ visualStyle: "memoryviz" });

    fireEvent.click(screen.getByRole("button", { name: "Help: Call Stack" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Call Stack", { selector: "h4" })).toBeInTheDocument();
    expect(
      screen.getByText(/currently active function calls/i)
    ).toBeInTheDocument();
  });

  it("closes the dialog when the close button is clicked", () => {
    renderCallStack({ visualStyle: "memoryviz" });

    fireEvent.click(screen.getByRole("button", { name: "Help: Call Stack" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
