# Accessibility plan

Based on how the app is built; it has not yet been tested with a real
screen reader (only automated checks). The core problem: the memory model is an SVG picture.
Boxes, ids and arrows are drawn shapes and text, so a screen reader announces
little or nothing, and almost every canvas action starts with the mouse.

## Done on the inline-editing branch

Item numbers refer to the original proposal: 1 keyboard canvas, 2 keyboard
alternative to palette drag, 3 text view, 4 announcements, 5 chip
listboxes, 6 focus management and contrast, 7 testing.

- Inline inputs have spoken labels, e.g. "Variable 2 id in frame `__main__`"
  or "Value of int object id3", and validation errors use `role="alert"` so
  they are read out.
- Undo/Redo shortcuts (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z, Ctrl+Y) and `[` / `]`
  to hide panels. See `keyboard-shortcuts.md`.
- Collapse buttons and rails are real buttons with labels.
- **Keyboard canvas (most of item 1).** Each box is a focusable group with a
  spoken name ("int object id3, value 5", "Frame `__main__`: a → id1").
  Roving tabindex: Tab / Shift+Tab move between boxes in reading order and
  leave the canvas at the ends; arrow keys move the focused object (Shift for
  50px); Enter / F2 edits the first field and focus returns to the box after
  the edit; Delete removes it. Visible `:focus-visible` ring.
  Code: `canvas/hooks/useCanvasKeyboard.ts`, `canvas/utils/boxDescriptions.ts`.
- **Keyboard add (a form of item 2).** `N` opens an "Add object" listbox
  (`canvas/components/AddObjectPicker.tsx`); the box goes in the first free
  spot (least-covered spot if the canvas is full) and gets focus.
- Optional **Grid Layout**: arrow keys then move a box one cell, which is
  easier to control without a mouse than pixel steps.
- **Rest of item 1.** `+` on a focused box adds a slot and opens it for
  typing; Shift+Delete (or Shift+Cmd/Ctrl+Backspace) while editing a slot
  removes it. After Delete removes a box, focus moves to its neighbour.
  Code: `inlineEditing/keys.ts`, `canvas/hooks/useCanvasKeyboard.ts`.
- **Item 2.** Enter or Space on a palette box adds it at the next free spot
  (same code path as `N`) and focuses it. `PaletteBox` → `Palette.onAddBox` →
  `MemoryModelEditor` → `Canvas.onKeyboardAddReady`.
- **Item 3.** A text outline ("Text view of the memory model": call stack,
  then objects by id) is always in the page, visually hidden, and kept in
  sync. Canvas Controls → View → **Text View** shows it as a panel; clicking
  a line focuses that box. In Python Tutor "values inline" mode, slots read
  as their values (`a → 42`) and hidden primitive boxes aren't listed.
  Code: `canvas/utils/modelText.ts` (`buildModelOutline`),
  `canvas/components/ModelTextView.tsx`.
- **Item 4.** A polite live region (`a11y/announcer.tsx`) reads edits worked
  out by diffing the canvas ("a now refers to id1", "Added variable 2 to
  `__main__`", "Deleted list id3"), "Undo"/"Redo", and a Submit summary
  ("Submitted. 2 issues found. First: …"). More than four changes at once
  (e.g. loading a question) collapse into one line. `describeChanges` in
  `modelText.ts`.
- **Item 5.** Inline inputs with chips are ARIA comboboxes; the chips are a
  `listbox` of `option`s. ↓/↑ highlight (`aria-activedescendant`), Enter
  picks, Esc clears the highlight first.
- **Item 6.** Confirmation dialogs and help popups move focus in, trap Tab,
  and return focus to the opener (`a11y/useDialogFocus.ts`). A global
  `prefers-reduced-motion` rule in `index.css` (the spotlight already had
  one). Contrast of ids/type labels checked in both themes and both styles;
  all pass AA (lowest: MemoryViz id on its grey cell, 4.74:1), guarded by
  `a11y/contrast.test.ts`. No colours needed changing.
- **Item 7 (automated part).** jest-axe checks for Canvas Controls (each
  tab), Palette, Add object picker, Text view, Help content, the
  confirmation dialog and help popup (`a11y/panels.axe.test.tsx`). They
  found and fixed: an unlabeled Practice/Test switch, tab buttons without
  `role="tab"`, `<main>` and a labelled backdrop inside the dialog.

## Still to do

- **Screen-reader walkthroughs**: VoiceOver (macOS) and NVDA (Windows) over a
  full question, in both Practice and Test mode and both visual styles.
  Nothing here has been tried with a real screen reader yet.
- Include a blind or low-vision student in the next user study.
- Keyboard way to reorder call-stack frames and to resize panels.
- Palette/Canvas Controls tabs could get arrow-key tab navigation (they are
  now real tabs but each is its own Tab stop).
