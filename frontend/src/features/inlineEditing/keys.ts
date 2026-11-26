/** Small keyboard helpers for the inline editor (kept pure for testing). */

type KeyLike = Pick<KeyboardEvent, "key" | "shiftKey" | "metaKey" | "ctrlKey" | "altKey">;

/**
 * The key that removes the slot being edited: Shift+Delete, or
 * Shift+Cmd/Ctrl+Backspace (Mac keyboards often have no forward Delete).
 * Plain Backspace/Delete still edit the text.
 */
export const isRemoveSlotKey = (e: KeyLike) =>
  !e.altKey &&
  ((e.key === "Delete" && e.shiftKey) ||
    (e.key === "Backspace" && e.shiftKey && (e.metaKey || e.ctrlKey)));

/**
 * Move the active option of a list of `count` options by `dir`, wrapping.
 * -1 means "none active": Down then goes to the first, Up to the last.
 */
export function stepActiveIndex(current: number, count: number, dir: 1 | -1): number {
  if (count <= 0) return -1;
  if (current < 0 || current >= count) return dir === 1 ? 0 : count - 1;
  return (current + dir + count) % count;
}

/** The key that adds a slot to the focused box ("+", with or without Shift). */
export const isAddSlotKey = (e: KeyLike) =>
  e.key === "+" && !e.metaKey && !e.ctrlKey && !e.altKey;
