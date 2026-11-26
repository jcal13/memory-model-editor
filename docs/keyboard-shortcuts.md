# Keyboard shortcuts

Shortcuts are ignored while you are typing in a text field, except the ones
listed under "While editing a field". On Windows/Linux use Ctrl where this says
Cmd.

## Anywhere in the workspace

| Keys | Action |
| --- | --- |
| `[` | Hide / show the palette and canvas controls |
| `]` | Hide / show the question and feedback panel |
| Cmd+Z | Undo |
| Shift+Cmd+Z, or Ctrl+Y | Redo |
| `N` | Add an object: opens a list of box types (arrow keys + Enter, or the type's letter, e.g. `I` int, `L` list). The new box goes in a free spot and gets focus; numbers and strings open their value editor |
| Esc | Close an open dialog, Help, or the tutorial guide. Focus goes back to the button that opened it |

## On the canvas

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Move between boxes: call-stack frames top to bottom, then objects row by row. Tab past the last box leaves the canvas |
| Arrow keys | Move the focused object 10px (Shift: 50px). With Grid Layout on, move it one cell, swapping with the box there. Frames stay in the call stack |
| Enter (or F2) | Edit the focused box's first field; after the edit, focus returns to the box |
| `+` | Add a slot to the focused box (a variable to a frame, an attribute to an object, an element to a list/tuple/set, a pair to a dict) and start typing in it. Does nothing on primitives |
| Click a value, name, type or ID | Edit it in place |
| Delete / Backspace | Delete the selected box (not the locked `__main__` frame). Focus moves to the next box in Tab order (or the previous one if it was last) |
| Esc | Clear the selection |

## While editing a field

| Keys | Action |
| --- | --- |
| Enter | Save. After naming a new variable, attribute or dict key, moves to its ID slot |
| Tab / Shift+Tab | Save and move to the next / previous field in the box |
| Esc | Cancel the edit (if a suggestion is highlighted, the first Esc just clears the highlight) |
| ↓ / ↑ | Highlight the next / previous suggestion chip (ids, types, function or class names). Wraps around |
| Enter on a highlighted chip | Pick it (same as clicking it) |
| Shift+Delete, or Shift+Cmd+Backspace | Remove the slot being edited (variable, attribute, element or pair), like its red `×`. Plain Delete/Backspace still edit the text |
| Typing right after `+` | Goes into the new slot, even before its input appears |

## In the palette

| Keys | Action |
| --- | --- |
| Tab | Reach the palette boxes (each says "Add list box…") |
| Enter or Space | Add that box at the next free spot on the canvas (or the first free grid cell) and focus it. Numbers and strings open their value editor |

## Screen reader support

- Feedback issues are Tab stops: each reads as one item, and focusing one
  highlights its boxes (as hovering does).
- Canvas Controls → View → **Text View** shows the model as text in a strip
  beside the canvas; the same
  outline is always present (visually hidden) for screen readers, under the
  heading "Text view of the memory model".
- Edits, Undo/Redo and Submit feedback are read out by a polite live region.

## Mouse-only today

These have no keyboard equivalent yet:
- Drag-to-connect from an ID slot to a box (typing the ID, or ↓ + Enter on a chip, does the same job).
- Resizing panels.
- Reordering call-stack frames.
