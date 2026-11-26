import { act, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import LiveAnnouncer, { ANNOUNCE_DELAY_MS, announce, announcerCount } from "./announcer";

describe("LiveAnnouncer", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("is a polite status region that joins messages sent together", () => {
    render(<LiveAnnouncer />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    act(() => {
      announce("Undo");
      announce("a now refers to id1");
      announce("a now refers to id1"); // duplicates are dropped
    });
    expect(region).toHaveTextContent("");
    act(() => jest.advanceTimersByTime(ANNOUNCE_DELAY_MS));
    expect(region).toHaveTextContent("Undo. a now refers to id1");
  });

  it("clears before repeating the same message so it is read again", () => {
    render(<LiveAnnouncer />);
    const region = screen.getByRole("status");
    act(() => {
      announce("Added list id3");
      jest.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    });
    act(() => announce("Added list id3"));
    expect(region).toHaveTextContent("");
    act(() => jest.advanceTimersByTime(ANNOUNCE_DELAY_MS));
    expect(region).toHaveTextContent("Added list id3");
  });

  it("does nothing without a region, and unsubscribes on unmount", () => {
    expect(() => announce("nobody listening")).not.toThrow();
    const { unmount } = render(<LiveAnnouncer />);
    expect(announcerCount()).toBe(1);
    unmount();
    expect(announcerCount()).toBe(0);
  });

  it("has no axe violations", async () => {
    jest.useRealTimers();
    const { container } = render(<LiveAnnouncer />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
