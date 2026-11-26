# Accessibility work: overnight report (2026-11-26)

Branch `experiment/inline-svg-editing`. Nothing committed, pushed, stashed or
switched; all changes are uncommitted in the working tree.

## Backups (taken before any edit)

- `/Users/jcal/Documents/PersonalClaude/memlab-backup-before-a11y-20261126-0200.patch` (`git diff HEAD`)
- `/Users/jcal/Documents/PersonalClaude/memlab-untracked-before-a11y-20261126-0200.tgz` (untracked files)

## Results

- `npx jest`: 55 suites, 421 tests, all pass (before: 47 suites, 368 tests).
- `npx tsc --noEmit -p .`: no errors.
- Browser check: not done. No dev server was running on 127.0.0.1:3000, and
  the task said not to start one, so everything is checked by jsdom tests
  only. **Please try it in a real browser**, especially the chip highlight
  and the Text view panel's position.

## What was done, per item

1. **Finish keyboard canvas.** `+` on a focused box adds a slot (frame
   variable, object attribute, list/tuple/set element, dict pair) and opens it
   for typing. It does nothing on primitives. While editing a slot,
   **Shift+Delete** or **Shift+Cmd/Ctrl+Backspace** removes that slot.
   After Delete removes a box, focus moves to the next box (or the previous one).
2. **Palette Enter/Space.** Adds the box through the same code path as `N`
   (free spot, or first free grid cell) and focuses it. Numbers and strings
   open their value editor. The palette box label now says "Add list box.
   Press Enter to add it to the canvas, or drag it".
3. **Text view.** The outline is always in the page, visually hidden,
   under the heading "Text view of the memory model". It has a summary,
   "Call stack" and "Objects" lists, e.g. `__main__: a → id1`, `id2: list [id3, id4]`.
   Canvas Controls → **View** → **Text View** shows it as a strip beside
   the canvas (changed after review: it first floated over the canvas's
   top-right corner and covered boxes). Clicking a line focuses that box. The setting
   is saved with the other UI settings.
4. **Live region.** It reads out edits, worked out by diffing the canvas, so every
   way of editing is covered (inline, keyboard, drag-to-connect, undo):
   "a now refers to id1", "Added variable 2 to __main__", "Deleted list id3",
   "int id2 is now 6", "Crossed out …". Undo/Redo say "Undo"/"Redo" first.
   Submit reads "Submitted. Correct…" or "Submitted. 2 issues found. First: …".
5. **Chip listboxes.** Inline inputs with chips are now comboboxes, and the
   chips are `role="option"` inside a `role="listbox"`. **↓/↑** highlight a
   chip (`aria-activedescendant`, with a blue outline), **Enter** picks it,
   and the first **Esc** clears the highlight. This covers id chips, primitive
   type chips, and function/class name chips.
6. **Focus and motion.** Confirmation dialogs and `?` help popups move focus
   in, trap Tab, and give focus back to the opener on close. A global
   `prefers-reduced-motion` rule was added. **Contrast:** ids and type labels
   pass AA in light and dark themes, in both MemoryViz and Python Tutor style.
   The lowest is the MemoryViz id on its grey cell, at 4.74:1. No colours were changed.
   A test now checks these pairs against `theme.css`.
7. **jest-axe.** I installed `jest-axe` and `@types/jest-axe` from the public
   registry. Checks run on Canvas Controls (all three tabs), Palette (both styles),
   the Add-object picker, the Text view (hidden and shown), Help content, the
   confirmation dialog and a help popup. They found real issues, now fixed:
   - The Practice/Test switch had no accessible name.
   - The palette and controls tab buttons lacked `role="tab"`.
   - The dialog had a `<main>` inside it and an `aria-label` on a plain backdrop div.

## Skipped and why

- **VoiceOver/NVDA walkthrough and a user study** (rest of item 7). These need
  a person; I listed them under "Still to do" in `accessibility-plan.md`.
- **Arrow-key navigation between palette/controls tabs.** They are real tabs
  now, but each one is still its own Tab stop. This wasn't in the plan.
- **Keyboard frame reordering and panel resizing.** These weren't in the plan
  either; they are noted in the docs.

## Decisions made

- **Slot removal key.** It is Shift+Delete or Shift+Cmd/Ctrl+Backspace, not
  plain Delete/Backspace on an empty slot. That way clearing an id never
  deletes the row by accident.
- **No invisible Tab stops.** The hidden outline has no buttons, so sighted
  keyboard users don't land on things they can't see. Only the visible panel
  has clickable lines.
- **Python Tutor "values inline" mode.** The outline and announcements show
  values (`a → 42`, "a is now 42") and leave out the hidden primitive boxes.
  Test mode gets the same text: it only describes what the student drew.
- **Large changes.** More than four changes at once (e.g. loading a question)
  collapse into one line, such as "Canvas updated: 5 boxes added".
- **Undo/Redo wrappers.** `undo`/`redo` in `MemoryModelEditor` are now small
  wrappers that announce first. The originals are `undoChange`/`redoChange`.
- **Existing tests.** Two existing tests in `CanvasControls.test.tsx` now look
  up the tabs by role `tab` instead of `button`.

## How to try it

- Tab to a list box and press `+`, type `3`, then Enter. Then press `+`
  again and Shift+Delete.
- Tab into the palette, then press Enter on "dict". The box appears and has focus.
- Open an id slot, press ↓ a few times, then Enter.
- Canvas Controls → View → Text View. Edit something and watch the text change,
  then click a line to jump to that box.
- With VoiceOver on (Cmd+F5), make edits and press Submit to hear the announcements.
- Open Clear Canvas, then press Esc. Focus goes back to the Clear button.

## Main files

New: `features/a11y/` (announcer, useDialogFocus, contrast and their tests,
`panels.axe.test.tsx`), `features/canvas/utils/modelText.ts`,
`canvas/components/ModelTextView.tsx`, `inlineEditing/keys.ts`,
`canvas/Canvas.keyboard.test.tsx`, `palette/components/PaletteBox.test.tsx`.

Changed: `useInlineEditing.tsx`, `useCanvasKeyboard.ts`, `Canvas.tsx`,
`PaletteBox.tsx`, `Palette.tsx`, `CanvasControls.tsx`, `MemoryModelEditor.tsx`,
UI-state persistence (`localStorage.ts`, `useLocalStorage.ts`,
`useMemoryModelEditorState.ts`), `ConfirmationModal.tsx`, `HelpIcon.tsx`,
`HelpContent.tsx`, `index.css`, `jest.setup.ts`, `package.json`/lock.

Docs: `accessibility-plan.md` (items moved to Done, "Still to do" added),
`keyboard-shortcuts.md` (every new key).

## Follow-up after the browser check (same day)

Checked in a real browser on 127.0.0.1:3000. Working: `+` / Shift+Delete,
chip ↓/↑/Enter highlight, palette Enter (adds and focuses the box), Text view
line clicks, Submit announcement. Fixed:
- **Text view covered the canvas.** It is now an in-flow strip to the right
  of the canvas, which narrows to make room; the canvas `?` moves left with it.
- **Selection outline went stale** when the canvas changed width without the
  window resizing (Text view, side panels). The overlay now re-measures on a
  ResizeObserver.
- **Confirmation dialogs didn't get focus** in development: React StrictMode's
  unmount/remount made the restore-focus timer pull focus back to the opener.
  The hook now ignores a stale restore.
- **Feedback issues weren't read by VoiceOver.** Each issue is now a focusable
  list item with one label (type, message, field), the ⚠ is hidden from
  screen readers, and focusing an issue highlights its boxes like hovering.
