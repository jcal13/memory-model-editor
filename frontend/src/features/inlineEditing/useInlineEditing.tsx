/**
 * Direct, in-place editing of MemoryViz boxes on the canvas (replaces the
 * floating BoxEditor dialog when enabled).
 *
 *  - Click a field (value, id slot, variable name, type, function/class name)
 *    to edit it right where it is drawn.
 *  - Drag from an id slot onto another box to point the slot at it.
 *  - Hover a box for a small toolbar (+ add slot, invalidate, delete) and a
 *    ghost "+"; hover a slot for a × to remove it.
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BoxType, CanvasElement, ID } from "../shared/types";
import {
  BoxGeom,
  FieldGeom,
  FieldRef,
  fieldAtPoint,
  isRefField,
  sameField,
} from "./fields";
import {
  PRIMITIVE_TYPES,
  getSlotTarget,
  parsePythonLiteral,
  addSlot,
  applyFieldText,
  applyRef,
  initialText,
  isRemovableField,
  removeSlot,
} from "./kindUpdates";
import styles from "./InlineEditing.module.css";
import { measureBox, useBoxGeometry } from "./useBoxGeometry";
import { ConnectDropHandler, useConnectGesture } from "./useConnectGesture";
import { ChipTray, TrashIcon } from "./overlayParts";
import {
  addLabel,
  countReferences,
  describeField,
  describeTarget,
  supportsSlots,
  tabOrder,
} from "./fieldHelpers";
import { isRemoveSlotKey, stepActiveIndex } from "./keys";
import { upsertInlinePrimitive } from "../editors/utils/pythonTutorInlinePrimitives";
import { formatPrimitiveValue } from "../canvas/utils/canvasReferences";

interface Options {
  enabled: boolean;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  addId: (id: number) => void;
  removeId: (id: ID) => void;
  removeElement: (boxId: number) => void;
  isProtected: (element: CanvasElement) => boolean;
  questionFunctionNames?: string[];
  reservedFunctionNames?: string[];
  canManageFunctions: boolean;
  classes?: string[];
  addClasses?: (name: string) => void;
  canManageClasses: boolean;
  /** Practice mode: auto ids, question-based suggestions, duplicate-id checks. */
  assisted: boolean;
  /** Python Tutor style with values drawn inside slots (no primitive boxes). */
  inlinePrimitives: boolean;
}

interface EditState {
  boxId: number;
  field: FieldRef;
}

interface ErrorState {
  boxId: number;
  field: FieldRef | null;
  message: string;
}

const CHIP_LIST_ID = "inline-chip-list";
const chipOptionId = (i: number) => `inline-chip-${i}`;

const HOVER_GRACE_MS = 220;

export function useInlineEditing(opts: Options) {
  const {
    enabled,
    wrapperRef,
    elements,
    setElements,
    addId,
    removeId,
    removeElement,
    isProtected,
  } = opts;

  const [hoverBoxId, setHoverBoxId] = useState<number | null>(null);
  const [hoverField, setHoverField] = useState<FieldRef | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<ErrorState | null>(null);
  const [pointerDown, setPointerDown] = useState(false);
  /** Keyboard-highlighted chip under the open input (-1: none). */
  const [activeChip, setActiveChip] = useState(-1);
  /** Values of the chips currently shown, in order (filled while rendering). */
  const chipValues = useRef<string[]>([]);
  useEffect(() => setActiveChip(-1), [edit, draft]);

  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipBlurCommit = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  /** Test mode: a slot dragged onto a box that has no id yet, waiting for it. */
  const pendingLink = useRef<{ sourceBoxId: number; field: FieldRef; targetBoxId: number } | null>(null);

  const byBoxId = useMemo(() => {
    const m = new Map<number, CanvasElement>();
    elements.forEach((e) => m.set(e.boxId, e));
    return m;
  }, [elements]);

  // ---------------------------------------------------------------- geometry

  const measure = useCallback(
    (boxId: number) => measureBox(wrapperRef.current, elementsRef.current, boxId),
    [wrapperRef]
  );

  /** Set further down, once the edit helpers it uses exist. */
  const connectDrop = useRef<ConnectDropHandler>(() => {});
  const { connect, connectRef, suppressClick, startConnect, claimPointerDown } = useConnectGesture({
    measure,
    elementsRef,
    assisted: opts.assisted,
    onDrop: connectDrop,
  });

  const activeBoxIds = useMemo(() => {
    const s = new Set<number>();
    [hoverBoxId, selectedBoxId, edit?.boxId, connect?.boxId, connect?.targetBoxId, error?.boxId].forEach(
      (id) => typeof id === "number" && s.add(id)
    );
    return Array.from(s);
  }, [hoverBoxId, selectedBoxId, edit, connect, error]);

  const { geoms, toLocal, pageZoom, refresh } = useBoxGeometry({
    enabled,
    wrapperRef,
    measure,
    activeBoxIds,
  });

  // Drop state for boxes that no longer exist.
  useEffect(() => {
    if (selectedBoxId !== null && !byBoxId.has(selectedBoxId)) setSelectedBoxId(null);
    if (hoverBoxId !== null && !byBoxId.has(hoverBoxId)) setHoverBoxId(null);
    if (edit && !byBoxId.has(edit.boxId)) setEdit(null);
  }, [byBoxId, selectedBoxId, hoverBoxId, edit]);

  // ---------------------------------------------------------------- editing

  const flashError = useCallback(
    (boxId: number, field: FieldRef | null, message: string) => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
      setError({ boxId, field, message });
      errorTimer.current = setTimeout(() => setError(null), 2600);
    },
    []
  );

  const updateKind = useCallback(
    (boxId: number, kind: BoxType) => {
      setElements((prev) =>
        prev.map((el) => (el.boxId === boxId ? { ...el, kind } : el))
      );
    },
    [setElements]
  );

  const isEditable = useCallback(
    (el: CanvasElement, field: FieldRef) => {
      const k = el.kind;
      switch (field.type) {
        case "boxId":
          return k.name !== "function";
        case "typeLabel":
          if (k.name === "function") return !isProtected(el);
          return k.name === "primitive" || k.name === "class";
        case "value":
          return k.name === "primitive" && k.type !== "NoneType";
        default:
          return true;
      }
    },
    [isProtected]
  );

  const startEdit = useCallback(
    (el: CanvasElement, field: FieldRef) => {
      if (!isEditable(el, field)) return;
      setSelectedBoxId(el.boxId);
      setError(null);
      // Bool values have two states: a click just flips them.
      if (field.type === "value" && el.kind.name === "primitive" && el.kind.type === "bool") {
        updateKind(el.boxId, {
          ...el.kind,
          value: el.kind.value === "true" ? "false" : "true",
        });
        return;
      }
      setDraft(slotText(el, field));
      setEdit({ boxId: el.boxId, field });
    },
    [isEditable, updateKind] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Prefill text; inline-primitive slots show the value itself (5, "hi"). */
  const slotText = (el: CanvasElement, field: FieldRef): string => {
    if (opts.inlinePrimitives && isRefField(field)) {
      const t = getSlotTarget(el.kind, field);
      const n = typeof t === "number" ? t : typeof t === "string" && /^\d+$/.test(t) ? Number(t) : null;
      if (n === null) return "";
      const target = elementsRef.current.find((o) => o.id === n);
      return target?.kind.name === "primitive" ? formatPrimitiveValue(target.kind) : `id${n}`;
    }
    return initialText(el.kind, field, el.id);
  };

  const closeEdit = useCallback(() => {
    pendingLink.current = null;
    setEdit(null);
    setDraft("");
  }, []);

  /** Validate + apply `text` to the field being edited. Returns success. */
  const commit = useCallback(
    (text: string, target: EditState | null = edit): boolean => {
      if (!target) return true;
      const el = elementsRef.current.find((e) => e.boxId === target.boxId);
      if (!el) return true;
      const { field } = target;

      if (field.type === "boxId") {
        const raw = text.trim().replace(/^id\s*/i, "");
        if (raw === "" || raw === "_") {
          // Practice keeps its auto-assigned ids; Test lets you clear one.
          if (!opts.assisted && el.id !== "_") {
            if (typeof el.id === "number") removeId(el.id);
            setElements((prev) =>
              prev.map((o) => (o.boxId === el.boxId ? { ...o, id: "_" } : o))
            );
          }
          return true;
        }
        if (!/^\d+$/.test(raw) || Number(raw) < 1) {
          flashError(el.boxId, field, "An id is a positive whole number");
          return false;
        }
        const next = Number(raw);
        // Test mode allows duplicates (reported at Submit, as on paper).
        if (
          opts.assisted &&
          next !== el.id &&
          elementsRef.current.some((o) => o.boxId !== el.boxId && o.id === next)
        ) {
          flashError(el.boxId, field, `id${next} is already used by another box`);
          return false;
        }
        const link = pendingLink.current;
        pendingLink.current = null;
        if (next === el.id && !link) return true;
        if (typeof el.id === "number" && el.id !== next) removeId(el.id);
        addId(next);
        setElements((prev) =>
          prev.map((o) => {
            if (o.boxId === el.boxId) return { ...o, id: next };
            // Finish a drag-to-connect that was waiting for this id.
            if (link && link.targetBoxId === el.boxId && o.boxId === link.sourceBoxId) {
              const r = applyRef(o.kind, link.field, next);
              return "error" in r ? o : { ...o, kind: r.kind };
            }
            return o;
          })
        );
        return true;
      }

      if (field.type === "typeLabel" && el.kind.name === "function") {
        const name = text.trim();
        const allowed = (opts.questionFunctionNames ?? []).filter(
          (n) => !(opts.reservedFunctionNames ?? []).includes(n)
        );
        if ((opts.reservedFunctionNames ?? []).includes(name)) {
          flashError(el.boxId, field, `${name} is reserved for the main frame`);
          return false;
        }
        if (opts.assisted && !opts.canManageFunctions && allowed.length > 0 && !allowed.includes(name)) {
          flashError(el.boxId, field, `Pick one of: ${allowed.join(", ")}`);
          return false;
        }
      }

      if (field.type === "typeLabel" && el.kind.name === "class") {
        const name = text.trim();
        const known = opts.classes ?? [];
        if (!opts.canManageClasses && known.length > 0 && !known.includes(name)) {
          flashError(el.boxId, field, `Pick one of: ${known.join(", ")}`);
          return false;
        }
        if (opts.canManageClasses && name && !known.includes(name)) {
          opts.addClasses?.(name);
        }
      }

      // Python Tutor inline values: a literal creates/updates a hidden primitive.
      if (opts.inlinePrimitives && isRefField(field)) {
        const t = text.trim();
        if (t !== "" && t !== "_" && !/^id/i.test(t)) {
          const literal = parsePythonLiteral(t);
          if (!literal) {
            flashError(el.boxId, field, 'Type a value (5, "hi", True, None) or id3 for an object');
            return false;
          }
          const current = getSlotTarget(el.kind, field);
          // Reuse the slot's primitive only if nothing else points at it;
          // otherwise `a = 42` would also change an alias like lst[0].
          const shared = countReferences(elementsRef.current, current) > 1;
          const up = upsertInlinePrimitive({
            elements: elementsRef.current,
            ownerElement: el,
            currentTarget: shared ? null : current,
            primitiveKind: literal,
          });
          const r = applyRef(el.kind, field, up.targetId);
          if ("error" in r) {
            flashError(el.boxId, field, r.error);
            return false;
          }
          if (up.created) addId(up.targetId);
          setElements(
            up.elements.map((o) => (o.boxId === el.boxId ? { ...o, kind: r.kind } : o))
          );
          return true;
        }
      }

      // Leaving a fresh number box blank keeps its default value.
      if (
        field.type === "value" &&
        text.trim() === "" &&
        el.kind.name === "primitive" &&
        (el.kind.type === "int" || el.kind.type === "float")
      ) {
        return true;
      }

      const result = applyFieldText(el.kind, field, text);
      if ("error" in result) {
        flashError(el.boxId, field, result.error);
        return false;
      }
      if (JSON.stringify(result.kind) !== JSON.stringify(el.kind)) {
        updateKind(el.boxId, result.kind);
      }
      return true;
    },
    [edit, flashError, updateKind, setElements, addId, removeId, opts]
  );

  const moveEdit = useCallback(
    (dir: 1 | -1) => {
      if (!edit) return;
      const el = elementsRef.current.find((e) => e.boxId === edit.boxId);
      const geom = measure(edit.boxId);
      if (!el || !geom) return closeEdit();
      const order = tabOrder(geom.fields);
      const i = order.findIndex((f) => sameField(f.ref, edit.field));
      const next = order[i + dir];
      if (next) startEdit(el, next.ref);
      else closeEdit();
    },
    [edit, measure, closeEdit, startEdit]
  );

  /** After naming a fresh row/key, jump straight to its empty id slot. */
  const followUpField = (el: CanvasElement, field: FieldRef): FieldRef | null => {
    const k = el.kind;
    if (field.type === "attrName" && (k.name === "function" || k.name === "class")) {
      const rows = k.name === "function" ? k.params : k.classVariables;
      const t = rows[field.index]?.targetId as unknown;
      if (t === "_" || t === null || t === undefined) return { type: "attrRef", index: field.index };
    }
    if (field.type === "dictKey" && k.name === "dict") {
      const v = Object.values(k.value ?? {})[field.index] as unknown;
      if (v === "_" || v === null || v === undefined) return { type: "dictValue", index: field.index };
    }
    return null;
  };

  /** Enter: commit, then move to the row's empty id slot if there is one. */
  const commitAndFollow = (text: string = draft) => {
    if (!edit) return;
    const target = edit;
    if (!commit(text, target)) {
      // Stay on this field (its error is showing) and type into it directly.
      keyQueue.current = [];
      accepting.current = true;
      return;
    }
    // Keys typed before the next field's input is ready belong to it.
    accepting.current = false;
    skipBlurCommit.current = true;
    // Read the post-commit kind on the next tick.
    setTimeout(() => {
      const el = elementsRef.current.find((x) => x.boxId === target.boxId);
      const next = el && followUpField(el, target.field);
      if (el && next) startEdit(el, next);
      else closeEdit();
    }, 0);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!edit) return;
    e.stopPropagation();
    const chipCount = chipValues.current.length;
    if (isRemoveSlotKey(e)) {
      // Keyboard version of the slot's red ×.
      const el = elementsRef.current.find((x) => x.boxId === edit.boxId);
      if (el && isRemovableField(el.kind, edit.field)) {
        e.preventDefault();
        skipBlurCommit.current = true;
        removeField(el, edit.field);
      }
    } else if (chipCount > 0 && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setActiveChip((i) => stepActiveIndex(i, chipCount, e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Escape" && activeChip >= 0) {
      setActiveChip(-1);
    } else if (e.key === "Escape") {
      skipBlurCommit.current = true;
      closeEdit();
    } else if (e.key === "Enter" && activeChip >= 0 && chipValues.current[activeChip] !== undefined) {
      e.preventDefault();
      pickValue(chipValues.current[activeChip]);
    } else if (e.key === "Enter") {
      commitAndFollow();
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (!commit(draft)) return;
      skipBlurCommit.current = true;
      const dir = e.shiftKey ? -1 : 1;
      setTimeout(() => moveEdit(dir), 0);
    }
  };

  const onInputBlur = () => {
    if (skipBlurCommit.current) {
      skipBlurCommit.current = false;
      return;
    }
    commit(draft);
    closeEdit();
  };

  const pickValue = (value: string) => {
    if (!edit) return;
    const target = edit;
    skipBlurCommit.current = true;
    if (commit(value, target)) {
      setTimeout(() => {
        const el = elementsRef.current.find((x) => x.boxId === target.boxId);
        const next = el && followUpField(el, target.field);
        if (el && next) startEdit(el, next);
        else closeEdit();
      }, 0);
    } else {
      skipBlurCommit.current = false;
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const lastFocusedEdit = useRef<EditState | null>(null);
  // A new slot's input appears only after the box redraws and is re-measured
  // (a frame or two later), and Enter hops to the next field on the next tick.
  // Keys typed in those gaps are queued and replayed in order into the right
  // field, so "+  c  Enter  3  Enter" works at any typing speed.
  const keyQueue = useRef<string[]>([]);
  const accepting = useRef(false);
  useLayoutEffect(() => {
    if (!edit) {
      keyQueue.current = [];
      return;
    }
    if (lastFocusedEdit.current !== edit) accepting.current = false;
    const onKey = (e: KeyboardEvent) => {
      if ((inputRef.current && accepting.current) || e.metaKey || e.ctrlKey || e.altKey) return;
      const active = document.activeElement;
      if (active && active !== document.body && !wrapperRef.current?.contains(active)) return;
      if (e.key === "Escape") {
        keyQueue.current = [];
        closeEdit();
      } else if (e.key === "Enter" || e.key === "Backspace" || e.key.length === 1) {
        keyQueue.current.push(e.key);
      } else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [edit, closeEdit, wrapperRef]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!edit || !el) return;
    const changed = lastFocusedEdit.current !== edit;
    lastFocusedEdit.current = edit;
    if (changed || document.activeElement !== el) {
      // preventScroll: focusing near an edge must not scroll the canvas.
      el.focus({ preventScroll: true });
      if (changed && keyQueue.current.length === 0) el.select();
    }
    // Only a newly opened input takes over typing; a redraw mid-hop doesn't.
    if (!changed) return;
    // The <input> element is reused across fields, so it never blurred.
    skipBlurCommit.current = false;
    // Replay queued keys: typing replaces the (selected) prefill, as it would.
    let text: string | null = null;
    while (keyQueue.current.length) {
      const key = keyQueue.current.shift()!;
      if (key === "Enter") {
        const value = text ?? draft;
        if (text !== null) setDraft(value);
        commitAndFollow(value);
        return; // the rest of the queue belongs to the next field
      }
      text = key === "Backspace" ? (text ?? "").slice(0, -1) : (text ?? "") + key;
    }
    if (text !== null) setDraft(text);
    accepting.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit, geoms]);

  // ---------------------------------------------------------------- actions

  const addSlotTo = useCallback(
    (el: CanvasElement) => {
      const r = addSlot(el.kind);
      if (!r) return;
      updateKind(el.boxId, r.kind);
      setSelectedBoxId(el.boxId);
      setDraft("");
      setEdit({ boxId: el.boxId, field: r.next });
    },
    [updateKind]
  );

  const removeField = useCallback(
    (el: CanvasElement, field: FieldRef) => {
      const k = removeSlot(el.kind, field);
      if (k) updateKind(el.boxId, k);
      setHoverField(null);
      closeEdit();
    },
    [updateKind, closeEdit]
  );

  const toggleInvalidated = useCallback(
    (el: CanvasElement) => {
      if (isProtected(el)) return;
      setElements((prev) =>
        prev.map((o) =>
          o.boxId === el.boxId ? { ...o, invalidated: !o.invalidated } : o
        )
      );
    },
    [setElements, isProtected]
  );

  const deleteBox = useCallback(
    (el: CanvasElement) => {
      if (isProtected(el)) return;
      closeEdit();
      setHoverBoxId(null);
      setSelectedBoxId(null);
      removeElement(el.boxId);
    },
    [removeElement, closeEdit, isProtected]
  );

  // When an edit closes and its input took focus with it, put keyboard focus
  // back on the box so Tab / arrows / Enter keep working from there.
  const lastEditBox = useRef<number | null>(null);
  useEffect(() => {
    if (edit) {
      lastEditBox.current = edit.boxId;
      return;
    }
    const boxId = lastEditBox.current;
    lastEditBox.current = null;
    if (boxId === null) return;
    const id = setTimeout(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      const g = wrapperRef.current?.querySelector<SVGGElement>(`g[data-canvas-box-id="${boxId}"][tabindex]`);
      g?.focus({ preventScroll: true });
    }, 0);
    return () => clearTimeout(id);
  }, [edit, wrapperRef]);

  // Delete / Escape for the selected box.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Escape") {
        setSelectedBoxId(null);
        closeEdit();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedBoxId !== null) {
        const el = elementsRef.current.find((x) => x.boxId === selectedBoxId);
        if (el && !isProtected(el)) {
          e.preventDefault();
          deleteBox(el);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, selectedBoxId, closeEdit, deleteBox, isProtected]);

  // Clicking empty canvas clears the selection.
  useEffect(() => {
    if (!enabled) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      // Presses on the overlay's own buttons must not hide it mid-click.
      if (t.closest("[data-inline-ui]")) return;
      if (t.closest("[data-canvas-box-id]")) {
        setPointerDown(true); // a possible box drag: hide chrome until release
        return;
      }
      setSelectedBoxId(null);
    };
    const onUp = () => {
      setPointerDown(false);
      refresh();
    };
    wrapper.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      wrapper.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enabled, wrapperRef, refresh]);

  // ------------------------------------------------------- canvas callbacks

  /** Called by a box on click (not drag). */
  const handleBoxClick = useCallback(
    (el: CanvasElement, ev?: MouseEvent) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      setSelectedBoxId(el.boxId);
      if (!ev) return;
      const geom = measure(el.boxId);
      const hit = geom && fieldAtPoint(geom, ev.clientX, ev.clientY);
      if (hit) startEdit(el, hit.ref);
      else closeEdit();
    },
    [measure, startEdit, closeEdit, suppressClick]
  );

  /** A drag-to-connect released over a box: point the slot at it. */
  const onConnectDrop = useCallback(
    (sourceBoxId: number, field: FieldRef, targetBoxId: number) => {
      const source = elementsRef.current.find((e) => e.boxId === sourceBoxId);
      const target = elementsRef.current.find((e) => e.boxId === targetBoxId);
      if (!source || !target) return;
      if (typeof target.id !== "number") {
        // Test mode: the target has no id yet. Ask for one, then link.
        startEdit(target, { type: "boxId" });
        pendingLink.current = { sourceBoxId: source.boxId, field, targetBoxId: target.boxId };
        return;
      }
      const r = applyRef(source.kind, field, target.id);
      if ("error" in r) flashError(source.boxId, field, r.error);
      else updateKind(source.boxId, r.kind);
      setSelectedBoxId(source.boxId);
    },
    [flashError, updateKind, startEdit]
  );

  connectDrop.current = onConnectDrop;

  // A drag that began on an open id input: drop the typing, keep the drag.
  const connectActive = connect?.active ?? false;
  useEffect(() => {
    const c = connectRef.current;
    if (!connectActive || !c || !edit) return;
    if (edit.boxId === c.boxId && sameField(edit.field, c.field)) {
      skipBlurCommit.current = true;
      closeEdit();
    }
  }, [connectActive, edit, closeEdit, connectRef]);

  const clearHoverSoon = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setHoverBoxId(null);
      setHoverField(null);
    }, HOVER_GRACE_MS);
  }, []);

  const onWrapperMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || connectRef.current?.active) return;
      const t = e.target as Element;
      if (t.closest("[data-inline-ui]")) {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        return;
      }
      const g = t.closest("[data-canvas-box-id]");
      const boxId = g ? Number(g.getAttribute("data-canvas-box-id")) : NaN;
      const el = elementsRef.current.find((x) => x.boxId === boxId);
      if (!el || g?.getAttribute("data-canvas-render-mode") !== "canvas") {
        clearHoverSoon();
        return;
      }
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      setHoverBoxId(boxId);
      const geom = measure(boxId);
      const hit = geom && fieldAtPoint(geom, e.clientX, e.clientY);
      const editable = hit && isEditable(el, hit.ref) ? hit.ref : null;
      setHoverField((prev) => (sameField(prev, editable) || prev === editable ? prev : editable));
      // Field-aware cursor on the box's transparent hit overlay.
      if (t instanceof SVGElement && t.getAttribute("data-overlay") === "true") {
        const base = el.kind.name === "function" ? "pointer" : "grab";
        t.style.cursor = editable ? (isRefField(editable) ? "pointer" : "text") : base;
      }
    },
    [enabled, measure, isEditable, clearHoverSoon, connectRef]
  );

  // ---------------------------------------------------------------- render

  const renderLayer = () => {
    chipValues.current = []; // refilled by renderEditor when an input is open
    if (!enabled) return null;
    const out: React.ReactNode[] = [];
    const zoom = pageZoom();
    const hideChrome = (pointerDown && !connect) || (connect?.active ?? false);

    // The controls follow the pointer: hovering another box shows its "+" and
    // toolbar even while a different box is selected (otherwise a frame's "+"
    // only appears after clicking the frame first).
    const chromeBoxId = edit?.boxId ?? hoverBoxId ?? selectedBoxId;
    const chromeEl = chromeBoxId !== null ? byBoxId.get(chromeBoxId) : undefined;
    const chromeGeom = chromeBoxId !== null ? geoms[chromeBoxId] : undefined;

    // Hover outline for a box that is not the selected one.
    if (!hideChrome && hoverBoxId !== null && hoverBoxId !== selectedBoxId && geoms[hoverBoxId]) {
      const r = toLocal(geoms[hoverBoxId].rect);
      out.push(
        <div key="hover-outline" className={styles.boxHoverOutline}
          style={{ left: r.left - 4, top: r.top - 4, width: r.width + 8, height: r.height + 8 }} />
      );
    }

    if (selectedBoxId !== null && geoms[selectedBoxId] && !(connect?.active)) {
      const r = toLocal(geoms[selectedBoxId].rect);
      out.push(
        <div key="sel-outline" className={styles.boxOutline}
          style={{ left: r.left - 4, top: r.top - 4, width: r.width + 8, height: r.height + 8 }} />
      );
    }

    // Toolbar + ghost add.
    if (!hideChrome && chromeEl && chromeGeom) {
      const r = toLocal(chromeGeom.rect);
      const locked = isProtected(chromeEl);
      const slots = supportsSlots(chromeEl.kind);
      // No room above (box at the top of the canvas)? Put the toolbar below.
      const visibleTop = wrapperRef.current?.scrollTop ?? 0;
      const toolbarPos =
        r.top - 8 - 32 < visibleTop
          ? { left: r.left - 4, top: r.top + r.height + 8, transform: "none" }
          : { left: r.left - 4, top: r.top - 8 };
      // The toolbar holds box-level actions only; adding slots is the edge "+".
      if (!locked) {
        out.push(
          <div key="toolbar" data-inline-ui className={`${styles.toolbar} ${styles.interactive}`}
            style={toolbarPos}
            onMouseDown={(e) => e.preventDefault()}>
            <button
              className={`${styles.toolButton} ${chromeEl.invalidated ? styles.toolButtonActive : ""}`}
              title={chromeEl.invalidated ? "Mark as valid again" : "Invalidate (grey out)"}
              onClick={() => toggleInvalidated(chromeEl)}>
              ⊘
            </button>
            <button className={`${styles.toolButton} ${styles.toolButtonDanger}`}
              title="Delete box (Del)" onClick={() => deleteBox(chromeEl)}>
              <TrashIcon />
            </button>
          </div>
        );
      }
      if (slots && !edit) {
        const seq = ["list", "tuple", "set"].includes(chromeEl.kind.name);
        const pos = seq
          ? { left: r.left + r.width, top: r.top + r.height / 2 + 10 }
          : { left: r.left + r.width / 2, top: r.top + r.height };
        out.push(
          <button key="ghost" data-inline-ui className={`${styles.ghostAdd} ${styles.interactive}`}
            style={pos} title={`Add ${addLabel(chromeEl.kind)}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => addSlotTo(chromeEl)}>
            +
          </button>
        );
      }
    }

    // Hovered field highlight + remove badge.
    if (!hideChrome && hoverBoxId !== null && hoverField && geoms[hoverBoxId] && !(edit && edit.boxId === hoverBoxId && sameField(edit.field, hoverField))) {
      const el = byBoxId.get(hoverBoxId);
      const f = geoms[hoverBoxId].fields.find((x) => sameField(x.ref, hoverField));
      if (el && f) {
        const r = toLocal(f.rect);
        out.push(<div key="field-hover" className={styles.fieldHover}
          style={{ left: r.left, top: r.top, width: r.width, height: r.height }} />);
        if (isRemovableField(el.kind, hoverField) && hoverField.type !== "attrName" && hoverField.type !== "dictKey") {
          out.push(
            <button key="remove" data-inline-ui className={`${styles.removeBadge} ${styles.interactive}`}
              style={{ left: r.left + r.width, top: r.top }}
              title="Remove this slot"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => removeField(el, hoverField)}>
              ×
            </button>
          );
        }
      }
    }

    // Active inline editor.
    if (edit && geoms[edit.boxId]) {
      const el = byBoxId.get(edit.boxId);
      const f = geoms[edit.boxId].fields.find((x) => sameField(x.ref, edit.field));
      if (el && f) out.push(renderEditor(el, f, geoms[edit.boxId], zoom));
    }

    // Error bubble.
    if (error && geoms[error.boxId]) {
      const g = geoms[error.boxId];
      const f = error.field && g.fields.find((x) => sameField(x.ref, error.field));
      const r = toLocal(f ? f.rect : g.rect);
      const below = edit && edit.boxId === error.boxId && isRefField(edit.field) ? 44 : 6;
      out.push(
        <div key="error" className={styles.error} role="alert"
          style={{ left: r.left + r.width / 2, top: r.top + r.height + below }}>
          {error.message}
        </div>
      );
    }

    // Drag-to-connect line.
    if (connect?.active) {
      const src = geoms[connect.boxId]?.fields.find((x) => sameField(x.ref, connect.field));
      const a = src ? toLocal(src.rect) : null;
      const b = toLocal({ left: connect.current.x, top: connect.current.y, width: 0, height: 0 });
      const tgt = connect.targetBoxId !== null ? geoms[connect.targetBoxId] : undefined;
      if (tgt) {
        const r = toLocal(tgt.rect);
        out.push(<div key="connect-target" className={styles.connectTarget}
          style={{ left: r.left - 4, top: r.top - 4, width: r.width + 8, height: r.height + 8 }} />);
      }
      if (a) {
        out.push(
          <svg key="connect-line" className={styles.connectLine}>
            <defs>
              <marker id="inline-connect-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={tgt ? "#22c55e" : "var(--accent-blue)"} />
              </marker>
            </defs>
            <line x1={a.left + a.width / 2} y1={a.top + a.height / 2} x2={b.left} y2={b.top}
              stroke={tgt ? "#22c55e" : "var(--accent-blue)"} strokeWidth={2} strokeDasharray={tgt ? undefined : "5 4"}
              markerEnd="url(#inline-connect-arrow)" />
          </svg>
        );
      }
    }

    return <div className={styles.layer}>{out}</div>;
  };

  const renderEditor = (el: CanvasElement, f: FieldGeom, geom: BoxGeom, zoom: number) => {
    const r = toLocal(f.rect);
    const fontPx = Math.max(11, (15 * geom.unit) / zoom);
    const isRef = isRefField(f.ref) || f.ref.type === "boxId";
    const hasError = !!error && error.boxId === el.boxId && sameField(error.field, f.ref);
    const k = el.kind;

    // Combobox wiring shared by both chip lists: the input keeps focus and
    // points at the arrow-key highlighted chip with aria-activedescendant.
    const comboProps = (count: number) => ({
      role: "combobox" as const,
      "aria-autocomplete": "list" as const,
      "aria-expanded": count > 0,
      "aria-controls": count > 0 ? CHIP_LIST_ID : undefined,
      "aria-activedescendant": activeChip >= 0 && activeChip < count ? chipOptionId(activeChip) : undefined,
    });
    const chipClass = (i: number, current: boolean) =>
      `${styles.chip} ${current ? styles.chipActive : ""} ${i === activeChip ? styles.chipKeyboard : ""}`;

    // Primitive type: chips only.
    if (f.ref.type === "typeLabel" && k.name === "primitive") {
      chipValues.current = [...PRIMITIVE_TYPES];
      return (
        <div key="editor" data-inline-ui className={`${styles.editor} ${styles.interactive}`}
          style={{ left: r.left, top: r.top, width: r.width, height: r.height }}>
          <input ref={inputRef} className={styles.input} readOnly value={k.type}
            aria-label={`${describeField(el, f.ref)}. Use the arrow keys to choose a type, Enter to pick.`}
            {...comboProps(PRIMITIVE_TYPES.length)}
            style={{ fontSize: fontPx }} onKeyDown={onInputKeyDown} onBlur={onInputBlur} />
          <ChipTray boundsRef={wrapperRef}>
            <div id={CHIP_LIST_ID} role="listbox" aria-label="Types" className={styles.chipList}>
              {PRIMITIVE_TYPES.map((t, i) => (
                <button key={t} id={chipOptionId(i)} role="option" aria-selected={i === activeChip}
                  tabIndex={-1} className={chipClass(i, t === k.type)}
                  onClick={() => pickValue(t)}>
                  {t}
                </button>
              ))}
            </div>
          </ChipTray>
        </div>
      );
    }

    let suggestions: { value: string; label: React.ReactNode; hint?: string }[] = [];
    let suggestionLabel = "";
    if (isRefField(f.ref)) {
      suggestions = elementsRef.current
        .filter(
          (o) =>
            o.kind.name !== "function" &&
            typeof o.id === "number" &&
            // Inline-value mode hides primitive boxes; their values are typed.
            !(opts.inlinePrimitives && o.kind.name === "primitive")
        )
        .sort((a, b) => (a.id as number) - (b.id as number))
        .filter((o, i, arr) => i === 0 || arr[i - 1].id !== o.id)
        .map((o) => ({
          // Bare numbers are int literals in inline-value mode, so say "id3".
          value: opts.inlinePrimitives ? `id${o.id}` : String(o.id),
          label: <span className={styles.chipId}>id{o.id as number}</span>,
          // Test mode: no peeking at values, just the ids you've handed out.
          hint: opts.assisted ? describeTarget(o) : undefined,
        }));
      suggestionLabel = opts.inlinePrimitives
        ? 'type a value (5, "hi", True, None), or id3 / a chip / drag for an object'
        : suggestions.length
        ? "type an id, pick one, or drag from the slot to a box"
        : "no objects yet — add one from the palette";
    } else if (f.ref.type === "typeLabel" && k.name === "function") {
      const reserved = opts.reservedFunctionNames ?? [];
      // Practice suggests the question's functions; Test only names already
      // used on this canvas, so nothing leaks from the answer.
      const source = opts.assisted
        ? opts.questionFunctionNames ?? []
        : elementsRef.current
            .filter((o) => o.kind.name === "function" && o.boxId !== el.boxId)
            .map((o) => (o.kind as { functionName: string }).functionName);
      const names = Array.from(new Set(source)).filter((n) => n && !reserved.includes(n));
      suggestions = names.map((n) => ({ value: n, label: n }));
      suggestionLabel = names.length ? (opts.assisted ? "functions in this question" : "names on this canvas") : "";
    } else if (f.ref.type === "typeLabel" && k.name === "class") {
      suggestions = (opts.classes ?? []).map((n) => ({ value: n, label: n }));
      suggestionLabel = suggestions.length ? "classes" : "";
    } else if (f.ref.type === "value" && k.name === "primitive" && k.type === "str") {
      suggestionLabel = "";
    }

    const filtered = isRefField(f.ref)
      ? suggestions
      : suggestions.filter((s) => s.value.toLowerCase().includes(draft.trim().toLowerCase()) || draft.trim() === initialText(k, f.ref, el.id));
    const minWidth = f.ref.type === "attrName" || f.ref.type === "typeLabel" ? 84 : 52;
    let width = Math.max(r.width, minWidth, (draft.length + 2) * fontPx * 0.62);
    let left = r.left + r.width / 2 - width / 2;
    if (f.ref.type === "attrName") {
      // Names are left-aligned and must not cover the row's id slot.
      const index = (f.ref as { index: number }).index;
      const slot = geom.fields.find((x) => x.ref.type === "attrRef" && (x.ref as { index: number }).index === index);
      const room = slot ? toLocal(slot.rect).left - 6 - r.left : width;
      left = r.left;
      width = Math.max(40, Math.min(width, room));
    }
    const shown = filtered.slice(0, 16);
    const options = [
      ...shown.map((s) => ({
        value: s.value,
        label: s.label,
        hint: s.hint,
        current: s.value.replace(/^id/i, "") === draft.trim().replace(/^id/i, ""),
        title: undefined as string | undefined,
      })),
      ...(isRefField(f.ref)
        ? [{ value: "_", label: <span className={styles.chipId}>id_</span>, hint: undefined, current: false, title: "Leave this slot unassigned" }]
        : []),
    ];
    chipValues.current = options.map((o) => o.value);

    return (
      <div key="editor" data-inline-ui className={`${styles.editor} ${styles.interactive}`}
        style={{ left, top: r.top, width, height: r.height }}>
        <input
          ref={inputRef}
          className={`${styles.input} ${isRef ? styles.inputRef : ""} ${f.ref.type === "attrName" ? styles.inputName : ""} ${hasError ? styles.inputError : ""}`}
          style={{ fontSize: fontPx }}
          value={draft}
          placeholder={isRef ? "id" : f.ref.type === "attrName" ? "name" : ""}
          aria-label={describeField(el, f.ref)}
          aria-invalid={hasError || undefined}
          {...comboProps(options.length)}
          spellCheck={false}
          autoComplete="off"
          inputMode={isRef ? "numeric" : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            if (hasError) setError(null);
          }}
          onKeyDown={onInputKeyDown}
          onBlur={onInputBlur}
          onMouseDown={(e) => e.stopPropagation()}
          // An open id slot can still be the start of a drag-to-connect:
          // a click places the caret, a drag past the threshold connects.
          onPointerDown={(e) => {
            if (e.button !== 0 || !isRefField(f.ref)) return;
            startConnect(el.boxId, f.ref, { x: e.clientX, y: e.clientY });
          }}
        />
        {(filtered.length > 0 || (isRefField(f.ref) && suggestionLabel)) && (
          <ChipTray boundsRef={wrapperRef}>
            <div id={CHIP_LIST_ID} role="listbox" aria-label={isRefField(f.ref) ? "Ids" : "Suggestions"}
              className={styles.chipList}>
              {options.map((o, i) => (
                <button key={o.value} id={chipOptionId(i)} role="option" aria-selected={i === activeChip}
                  tabIndex={-1} title={o.title} className={chipClass(i, o.current)}
                  onClick={() => pickValue(o.value)}>
                  {o.label}
                  {o.hint && <span className={styles.chipHint}>{o.hint}</span>}
                </button>
              ))}
            </div>
            {suggestionLabel && <div className={styles.chipsLabel}>{suggestionLabel}</div>}
          </ChipTray>
        )}
      </div>
    );
  };

  const selectedElement = selectedBoxId !== null ? byBoxId.get(selectedBoxId) ?? null : null;

  return {
    handleBoxClick,
    claimPointerDown,
    onWrapperMouseMove,
    onWrapperMouseLeave: clearHoverSoon,
    selectedElement,
    select: setSelectedBoxId,
    editing: edit !== null,
    /** Keyboard: open the editor on the box's first field (Tab walks the rest). */
    editFirstField: (boxId: number) => {
      const el = elementsRef.current.find((e) => e.boxId === boxId);
      const g = measure(boxId);
      if (!el || !g) return;
      const first =
        tabOrder(g.fields).find((f) => isEditable(el, f.ref)) ??
        g.fields.find((f) => (f.ref.type === "typeLabel" || f.ref.type === "boxId") && isEditable(el, f.ref));
      if (first) startEdit(el, first.ref);
    },
    /** Keyboard "+": add a slot to the box and open it for typing. */
    addSlotByBoxId: (boxId: number): boolean => {
      const el = elementsRef.current.find((e) => e.boxId === boxId);
      if (!el || !supportsSlots(el.kind)) return false;
      addSlotTo(el);
      return true;
    },
    startEditByBoxId: (boxId: number, field: FieldRef) => {
      setSelectedBoxId(boxId);
      setDraft("");
      setEdit({ boxId, field });
    },
    layer: renderLayer(),
  };
}
