import { isAddSlotKey, isRemoveSlotKey, stepActiveIndex } from "./keys";

const key = (k: string, mods: Partial<KeyboardEvent> = {}) =>
  ({ key: k, shiftKey: false, metaKey: false, ctrlKey: false, altKey: false, ...mods }) as KeyboardEvent;

describe("inline editor keys", () => {
  it("removes a slot with Shift+Delete or Shift+Cmd/Ctrl+Backspace only", () => {
    expect(isRemoveSlotKey(key("Delete", { shiftKey: true }))).toBe(true);
    expect(isRemoveSlotKey(key("Backspace", { shiftKey: true, metaKey: true }))).toBe(true);
    expect(isRemoveSlotKey(key("Backspace", { shiftKey: true, ctrlKey: true }))).toBe(true);
    // Ordinary text editing keys are left alone.
    expect(isRemoveSlotKey(key("Delete"))).toBe(false);
    expect(isRemoveSlotKey(key("Backspace"))).toBe(false);
    expect(isRemoveSlotKey(key("Backspace", { shiftKey: true }))).toBe(false);
    expect(isRemoveSlotKey(key("Backspace", { metaKey: true }))).toBe(false);
    expect(isRemoveSlotKey(key("Delete", { shiftKey: true, altKey: true }))).toBe(false);
  });

  it("adds a slot with + but not with modifier shortcuts", () => {
    expect(isAddSlotKey(key("+"))).toBe(true);
    expect(isAddSlotKey(key("+", { shiftKey: true }))).toBe(true);
    expect(isAddSlotKey(key("+", { metaKey: true }))).toBe(false);
    expect(isAddSlotKey(key("="))).toBe(false);
  });

  it("steps the active chip with wrap-around, starting from none", () => {
    expect(stepActiveIndex(-1, 3, 1)).toBe(0);
    expect(stepActiveIndex(-1, 3, -1)).toBe(2);
    expect(stepActiveIndex(0, 3, 1)).toBe(1);
    expect(stepActiveIndex(2, 3, 1)).toBe(0);
    expect(stepActiveIndex(0, 3, -1)).toBe(2);
    expect(stepActiveIndex(5, 3, 1)).toBe(0); // stale index after the list shrank
    expect(stepActiveIndex(0, 0, 1)).toBe(-1);
  });
});
