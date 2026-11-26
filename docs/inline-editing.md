# Inline (in-SVG) editing — experiment

Branch: `experiment/inline-svg-editing`

The user study showed students dislike the shared floating edit dialog. This
experiment removes it in **both Practice and Test mode**, for **both MemoryViz and
Python Tutor styles**: you edit a box by clicking the part of the drawing you
want to change.

## Interaction model

| You want to… | Do this |
| --- | --- |
| Change a primitive's value | Click the value, type, Enter. `bool` flips on click. |
| Change a primitive's type | Click the type label (`int`), pick from the chips. The value is converted. |
| Point a slot at an object | Click the slot (`id_`), type `3` (or `id3`) and press Enter, or click a chip. **Or** drag from the slot onto the target box. |
| Rename a variable / attribute | Click the name. |
| Rename a function frame / class | Click the name in the header (the locked `__main__` frame can't be renamed). |
| Change a box's own id | Click the header id. Ids already in use are rejected. |
| Add an element / variable / attribute / pair | Hover the box → the dashed `+` on its edge (right end of a list, bottom of a frame/object/dict). The new slot opens for typing right away. |
| Remove one slot | Hover the slot → red `×`. |
| Invalidate / delete a box | Hover toolbar `⊘` / trash (shown above the box, or below it near the top of the canvas), or select the box and press Delete. |
| Move between fields | Tab / Shift+Tab. After naming a new row, Enter jumps to its id slot. Esc cancels. |

Dropping a new `int` / `float` / `str` from the palette opens its value editor
immediately.

### Python Tutor style

With "values inline" (the default, primitives drawn inside slots), a slot takes a
**Python literal**: `5`, `-2.5`, `"hi"`, `True`, `None`. This creates (or updates)
the hidden primitive behind the slot, as the old dialog did. If that primitive is
shared with another slot, a new one is made, so `a = 42` doesn't change an alias
like `lst[0]`. Type `id3`, pick a chip, or drag to point at an object instead.
With standalone primitives on, slots take ids exactly as in MemoryViz style.
Clicking a slot edits it; it no longer jumps to the referenced object.

To compare against the old dialog, run
`localStorage.setItem("memorylab_inline_editing", "off")` and reload.

## How it's built

- `features/inlineEditing/fields.ts` finds the editable fields by reading the
  classed `<text>` elements MemoryViz already emits. The renderer is unchanged.
- `features/inlineEditing/kindUpdates.ts` holds the pure edit logic (validation,
  add/remove slots, dict key handling), unit tested in `kindUpdates.test.ts`.
- `features/inlineEditing/useInlineEditing.tsx` owns the editing state and draws
  the overlay (an HTML layer inside the canvas wrapper): hover/selection
  outline, toolbar, ghost `+`, inline `<input>`, id chips, error bubble, and the
  drag-to-connect arrow. Split out of it:
  - `useBoxGeometry.ts`: measures the boxes the overlay needs from the DOM and
    re-measures on scroll, zoom and canvas resize.
  - `useConnectGesture.ts`: the drag-from-a-slot gesture (threshold, target
    under the pointer, swallowing the click after a drag).
  - `fieldHelpers.ts` (field order, labels) and `overlayParts.tsx` (chip tray,
    icons).
- Canvas wiring for the keyboard lives in `canvas/hooks/useCanvasKeyboard.ts`
  and `useKeyboardAdd.tsx` (the `N` picker and palette Enter), announcements in
  `a11y/useAnnounceChanges.ts`. Reference arrows (both styles) are drawn by
  `canvas/components/ReferenceArrows.tsx`.
- `Canvas.tsx` uses the hook when `!sandbox && visualStyle === "memoryviz"`.
  Boxes report clicks along with the mouse event so the hook can hit-test, and
  boxes can "claim" a pointerdown on an id slot so it becomes a connect
  gesture instead of a box drag or frame reorder.

Incidental fixes made along the way:
- Dict entries were never drawn on the canvas: `extractDictionary` read
  `kind.pairs`, but dicts store `kind.value`.
- Per-box callbacks (and `CallStack`'s no-op `updatePosition`) were recreated
  on every render, which redrew every box's SVG. They are now stable, so
  overlay-only state changes don't redraw boxes.

## Known limitations (MVP)

- A box can't be dragged by grabbing one of its id slots, because that starts
  drag-to-connect. Grab the header or the edge instead.
- Each box's invisible hit area includes 12px of padding, so tightly overlapping
  boxes can steal clicks (this was already the case before).
- Only tested with mouse and keyboard. Touch hasn't been tried.
- Python Tutor reference arrows and the Linked List view were not specifically re-tested with inline edits.

## Test mode

The gestures are the same in both modes; only the help changes.

| Aspect | Practice | Test |
| --- | --- | --- |
| New box id | Auto-assigned | Starts as `id_`; click the header id and type one. Clearing it returns to `id_`. |
| Duplicate box ids | Rejected inline | Allowed (reported at Submit, as on paper) |
| Id chips under a slot | Every object id + value hint (`id3 "hi"`) | Ids on the canvas, no value hints |
| Function names | Chips from the question; must pick one | Free text; chips only suggest names already on this canvas |
| Drag-to-connect onto a box with no id | n/a | Opens that box's id editor; the slot fills in once you type the id |

Not done: a visual "needs an id" cue for `id_` boxes in Test mode (open question:
is that a hint the exam shouldn't give?).

## Undo fix (pre-existing bug)

After Undo, the canvas sometimes re-positions restored boxes (e.g. clamping them
into a narrower canvas). That nudge was recorded as a new step, which deleted the
redo stack and left Undo bouncing between two states, never greying out. Now,
for 500ms after Undo/Redo, position-only changes are folded into the restored
entry. Any other change still records as a normal edit.

A related cause of Undo "jitter": the canvas also nudges a box just after an
edit (e.g. a dropped box clamped away from the call stack), and that nudge was
recorded as its own step. Undoing it moved the box back out of bounds, the
canvas immediately nudged it in again, and the Undo seemed to do nothing. A
position-only change within 300ms of a recorded step is now folded into it.

## Python Tutor crash on CSC148 Prep Q1

Prep question data stores class attributes as `{key, value}`, but the Python
Tutor renderer expected `{name, targetId}` and crashed. This branch includes the
renderer part of `ff5d0d7` (`normalizeClassVariable`, from
`origin/fix/python-tutor-crush`, which was never merged into `dev`). The
inline editor normalizes those rows too, so editing them writes `{name, targetId}`.
That commit's toggle removal and question-link resume change are **not** included.

## Tutorial

The guide advances on canvas state, so inline edits count. It got stuck in
practice for two reasons, both fixed:
- After editing an object it stays selected, and the `+`/toolbar belonged to the
  selected box, so hovering `__main__` showed no `+`. The controls now follow
  the hovered box.
- Keys typed right after `+` (before the new row's input appeared) or right
  after Enter (while hopping to the ID slot) were dropped. They are now queued
  and replayed into the right field.

Step instructions and the Help panel describe the inline gestures (the old text
remains when inline editing is opted out).
When a step's task becomes "add the variable", the guide moves keyboard focus
to `__main__` (only on that change, never while typing), so `+` adds the row;
the tips say so, and the add-an-int text mentions `N` then `I`. If the
variable already exists, the tip points at its ID slot instead of `+`.

In Python Tutor style the demo always draws primitives as standalone boxes, so
students still build each object before naming it (Python's order). The saved
"Standalone Primitives" setting is untouched and its toggle is hidden during
the demo; tips say "the Global frame" instead of `__main__` in that style.

Frame names may be qualified, e.g. `LinkedList.move_to_back`; class names
must still be plain identifiers.

## Collapsible side panels (layout prototype)

Hiding the palette or question used to need dragging a divider until it
snapped shut, and the reopen tabs were fixed, light-only overlays. Now:
- Each divider has a small collapse button (also `[` for the palette and `]`
  for the question, ignored while typing).
- A collapsed panel becomes a 34px in-flow rail, so the canvas gets the width.
  The palette rail keeps Undo/Redo; clicking a rail's label or chevron reopens it.
- The tutorial's tips vary how to connect variables: typing the ID for `a`,
  dragging as an alternative for `b`, and dragging suggested first for `c`.

Not done: opening a collapsed palette temporarily while dragging in a box, and
a Submit button on the question rail.

## Reference arrows in both styles

The Reference Arrows toggle now appears in MemoryViz style too. There the IDs
stay visible and an arrow runs from each ID slot to its object: it leaves the
slot's side and enters the object's side at mid-height (aimed at the drawn
box, not its padded hit area), so it doesn't cut through boxes stacked in
between. A slot pointing at its own box loops out past the right edge and
into the top edge (or the bottom edge, for a box at the top of the canvas).
Python Tutor style is unchanged.

The tutorial's Show/Hide guide button moved to the question panel header,
beside "← Exit demo" (the duplicate "Exit tutorial" was removed). Only the
round `?` stays in the bottom-right corner, and the feedback panel has bottom
padding so its last button scrolls clear of it.

Modal dialogs and help popups now sit above the tutorial layers
(`--dialog-layer`), so the guide card no longer hides a dialog's buttons.

## Overlay fixes

- The selection/hover outline is measured from the box's drawn shapes, not from
  its SVG viewport (renderers don't always draw from (0, 0)), so it matches the box.
- Chip lists stay inside the visible canvas: narrowed to wrap onto more lines and
  shifted sideways near an edge.
- The overlay re-measures when the canvas changes width without the window
  resizing (a side panel or the Text view opening), so outlines stay on their box.

## Keyboard canvas and grid layout

- Boxes are focusable with spoken names. Tab moves between them, arrow keys
  move them, Enter edits, and `N` opens an "Add object" list. See
  `keyboard-shortcuts.md` and `accessibility-plan.md`.
- **Grid Layout** (Canvas Controls → Settings) snaps objects into cells
  right of the call stack, filled row by row. Turning it on packs the
  current objects in reading order. A dragged box snaps to the nearest cell
  and swaps with the box there; arrow keys move one cell; new objects (palette
  drop or `N`) take the cell under them or the first free one. Cells reflow
  when the canvas width changes. Each column is as wide as its widest box and
  each row as tall as its tallest, so a long name or a tall object only
  stretches its own column or row; columns are dropped until their widths fit
  the canvas. Sizes come from the boxes as drawn (not per-type estimates, which
  let wide or tall objects overflow into their neighbours). Because sizes
  follow contents, a swap or edit can shift the boxes beside it. Cells exist
  only in memory: turning the grid off leaves boxes where they are. Arrow keys
  stop at the grid's edges: no wrapping to the next row, and no moving below
  the last row the canvas shows. On a canvas too short for every row (e.g. a
  very wide object forcing one column), the grid zooms the canvas out a step at
  a time (to 50% at most) until every box fits. It never zooms in by itself,
  and if you zoom back in it leaves your zoom alone (boxes may overlap) until
  the layout next changes. Past 50%, overflow boxes are clamped to the bottom
  edge and can overlap.
  Open question: reference arrows still cut across boxes in between (routing
  them through the gaps between cells is a possible follow-up).
  Code: `canvas/utils/gridLayout.ts`, `canvas/hooks/useGridLayout.ts`.

## Question at the bottom (layout prototype)

Canvas Controls → Settings → **Question at Bottom** (now the default; the
side panel had boxes overlapping the call stack at common widths) docks the
question and feedback under the canvas, side by side (question 3/5, feedback 2/5), so the
canvas gets the full width. Drag the bar above the dock to resize it (the
height is remembered); its chevron or `]` hides it to a thin "Question &
feedback" bar. The right-side panel is unchanged when the setting is off.

The canvas's top-right corner has a small toolbar (zoom out, current zoom,
which resets to 100%, zoom in, and a Grid toggle), so these no longer hide in
Canvas Controls. The drag bar resizes by the distance dragged, so a panel
below the dock (Linked List view) no longer makes it jump; the dock stops when
the canvas reaches 220px and gives height back when the window shrinks. In this
layout the canvas no longer keeps a hidden scroll area for the Linked List
panel, which had left blank space under the call stack.

Trade-offs seen so far: the canvas loses height, so the call stack gets
shorter and tall models (or many Grid Layout rows) run out of room sooner,
while wide models gain space. Long feedback lists scroll more in the
shorter dock. Not done: a horizontal split you can drag between question and
feedback, and the Linked List view and the dock share the bottom (both
stack under the canvas).
Code: `memoryModelEditor/components/BottomQuestionDock.tsx`, `layout="row"`
in `InformationTabs`. Saved as `questionPanel: "bottom" | "side"` in the UI
state; the earlier `questionAtBottom` flag is ignored, so everyone starts at
the bottom once.
