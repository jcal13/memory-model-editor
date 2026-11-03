import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import DeviceGuidance, { GUIDANCE_QUERIES as Q } from "./DeviceGuidance";
let matches: Record<string, boolean>;
let listeners: Set<() => void>;
const writeText = jest.fn();
beforeEach(() => {
  sessionStorage.clear(); matches = {}; listeners = new Set();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: jest.fn((q: string) => ({
    get matches() { return !!matches[q]; },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  })) });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function () { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function () { this.removeAttribute("open"); } });
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
});
it.each([
  { name: "phone", small: true, touch: true, fine: false, expected: true },
  { name: "large tablet", small: false, touch: true, fine: false, expected: true },
  { name: "tablet with trackpad", small: false, touch: true, fine: true, expected: false },
  { name: "desktop", small: false, touch: false, fine: true, expected: false },
  { name: "small window", small: true, touch: false, fine: true, expected: true },
])("handles $name", ({ small, touch, fine, expected }) => {
  matches = { [Q.small]: small, [Q.touch]: touch, [Q.fine]: fine };
  const { container } = render(<DeviceGuidance />);
  expect(container.querySelector("dialog")!.open).toBe(expected);
});
it("reacts to pointer changes and removes listeners", () => {
  matches[Q.touch] = true;
  const { container, unmount } = render(<DeviceGuidance />);
  expect(container.querySelector("dialog")!.open).toBe(true);
  act(() => { matches[Q.fine] = true; listeners.forEach(fn => fn()); });
  expect(container.querySelector("dialog")!.open).toBe(false);
  unmount(); expect(listeners.size).toBe(0);
});
it("blocks on reload even with a previously saved dismissal", () => {
  matches[Q.small] = true;
  sessionStorage.setItem("memorylab_device_guidance_dismissed", "true");
  const first = render(<DeviceGuidance />);
  expect(first.container.querySelector("dialog")!.open).toBe(true);
  expect(screen.queryByText("Continue anyway")).not.toBeInTheDocument();
  first.unmount();
  const second = render(<DeviceGuidance />);
  expect(second.container.querySelector("dialog")!.open).toBe(true);
});
it("prevents Escape dismissal and backdrop clicks", () => {
  matches[Q.small] = true;
  const { container } = render(<DeviceGuidance />);
  const dialog = container.querySelector("dialog")!;
  const cancel = new Event("cancel", { bubbles: true, cancelable: true });
  fireEvent(dialog, cancel);
  expect(cancel.defaultPrevented).toBe(true);
  fireEvent.click(dialog);
  expect(dialog.open).toBe(true);
});
it.each(["/", "/?practice=7"])("copies the current page URL %s without dismissing", async (url) => {
  matches[Q.small] = true;
  window.history.replaceState({}, "", url);
  const { container } = render(<DeviceGuidance />);
  fireEvent.click(screen.getByText("Copy link"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Link copied"));
  expect(writeText).toHaveBeenCalledWith(window.location.href);
  expect(container.querySelector("dialog")!.open).toBe(true);
  window.history.replaceState({}, "", "/");
});
it("offers a manual copy fallback", async () => {
  matches[Q.small] = true; writeText.mockRejectedValue(new Error("denied"));
  render(<DeviceGuidance />);
  fireEvent.click(screen.getByText("Copy link"));
  expect(await screen.findByLabelText("Page link")).toHaveValue(window.location.href);
});
