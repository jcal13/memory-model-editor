import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import ConfirmationModal from "../memoryModelEditor/components/ConfirmationModal";
import HelpIcon from "../shared/components/HelpIcon";

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Clear canvas</button>
      {open && <ConfirmationModal title="Clear?" message="Sure?" onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)} />}
    </>
  );
}

describe("dialog focus", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("returns focus to the opener after a confirmation dialog closes", () => {
    render(<ModalHarness />);
    const opener = screen.getByRole("button", { name: "Clear canvas" });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    act(() => jest.runAllTimers());
    expect(opener).toHaveFocus();
  });

  it("keeps focus inside the dialog under StrictMode's dev remount", () => {
    render(<StrictMode><ModalHarness /></StrictMode>);
    const opener = screen.getByRole("button", { name: "Clear canvas" });
    opener.focus();
    fireEvent.click(opener);
    act(() => jest.runAllTimers());
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });

  it("keeps Tab inside the dialog", () => {
    render(<ModalHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Clear canvas" }));
    const confirm = screen.getByRole("button", { name: "Confirm" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    confirm.focus();
    fireEvent.keyDown(confirm, { key: "Tab" });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(cancel, { key: "Tab", shiftKey: true });
    expect(confirm).toHaveFocus();
  });

  it("moves focus into a help popup and back to its ? button", () => {
    render(<HelpIcon title="Grid Layout" text="Explains the grid." />);
    const icon = screen.getByRole("button", { name: "Help: Grid Layout" });
    icon.focus();
    fireEvent.click(icon);
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    act(() => jest.runAllTimers());
    expect(icon).toHaveFocus();
  });
});
