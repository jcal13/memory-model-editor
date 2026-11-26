import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CanvasElement } from "../../shared/types";
import { boxReadingOrder, describeBox } from "../utils/boxDescriptions";
import { isAddSlotKey } from "../../inlineEditing/keys";

/** Pixels a box moves per arrow key press (Shift: a bigger step). */
export const ARROW_STEP = 10;
export const ARROW_STEP_LARGE = 50;

type Options = {
  enabled: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  elements: CanvasElement[];
  /** Select a box (shows its outline and toolbar), or clear with null. */
  select: (boxId: number | null) => void;
  /** Open the inline editor on the box's first field. */
  editFirstField: (boxId: number) => void;
  /** Move an object box to an absolute canvas position. */
  moveTo: (boxId: number, x: number, y: number) => void;
  /** Grid layout: move one cell instead; returns true when it handled the key. */
  gridMove?: (boxId: number, dx: number, dy: number) => boolean;
  /** Whether an inline edit is open (keys then belong to the input). */
  editing: boolean;
  /** Open the "add object" picker. */
  openAddPicker: () => void;
  /** "+": add a slot to the box and start typing in it; false if it has none. */
  addSlot?: (boxId: number) => boolean;
};

const groupsIn = (svg: SVGSVGElement) =>
  Array.from(svg.querySelectorAll<SVGGElement>("g[data-canvas-box-id]"));

const boxIdOf = (g: Element) => Number(g.getAttribute("data-canvas-box-id"));

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
};

/**
 * Keyboard access to the canvas:
 * - Each box is a focusable group with a spoken description. Only one box is
 *   in the page's Tab sequence at a time (roving tabindex); inside the canvas
 *   Tab / Shift+Tab move between boxes in reading order and leave the canvas
 *   after the last / before the first.
 * - Arrow keys move the focused object (Shift for bigger steps).
 * - Enter edits the box's first field; "+" adds a slot.
 * - After Delete removes the focused box, focus moves to its neighbour.
 * - N (anywhere outside a text field) opens the "add object" picker.
 */
export function useCanvasKeyboard(opts: Options) {
  const { enabled, svgRef, elements } = opts;
  const [current, setCurrent] = useState<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const order = (): number[] => {
    const svg = svgRef.current;
    if (!svg) return [];
    return boxReadingOrder(
      groupsIn(svg).map((g) => {
        const r = g.getBoundingClientRect();
        return { boxId: boxIdOf(g), isFrame: g.getAttribute("data-canvas-kind") === "function", left: r.left, top: r.top };
      })
    );
  };

  const focusBox = (boxId: number) => {
    const g = svgRef.current?.querySelector<SVGGElement>(`g[data-canvas-box-id="${boxId}"]`);
    if (!g) return false;
    g.setAttribute("tabindex", "0");
    g.focus();
    return true;
  };

  // Accessible names and roving tabindex, refreshed after every render.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const groups = groupsIn(svg);
    if (!enabled) {
      groups.forEach((g) => g.removeAttribute("tabindex"));
      return;
    }
    const byBoxId = new Map(elements.map((e) => [e.boxId, e]));
    const tabStop = current !== null && byBoxId.has(current) ? current : order()[0];
    groups.forEach((g) => {
      const el = byBoxId.get(boxIdOf(g));
      if (!el) return;
      g.setAttribute("tabindex", boxIdOf(g) === tabStop ? "0" : "-1");
      g.setAttribute("role", "group");
      g.setAttribute("aria-roledescription", el.kind.name === "function" ? "frame" : "object");
      g.setAttribute("aria-label", describeBox(el));
      g.setAttribute("focusable", "true");
    });
  });

  // Focusing a box (Tab or click) selects it.
  useEffect(() => {
    const svg = svgRef.current;
    if (!enabled || !svg) return;
    const onFocusIn = (e: FocusEvent) => {
      const g = e.target as Element | null;
      if (!g || !g.matches?.("g[data-canvas-box-id]")) return;
      const boxId = boxIdOf(g);
      setCurrent(boxId);
      optsRef.current.select(boxId);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const g = e.target as Element | null;
      if (!g || !g.matches?.("g[data-canvas-box-id]") || optsRef.current.editing) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const boxId = boxIdOf(g);
      if (e.key === "Tab") {
        const ids = order();
        const next = ids[ids.indexOf(boxId) + (e.shiftKey ? -1 : 1)];
        if (next === undefined) return; // Leave the canvas.
        e.preventDefault();
        focusBox(next);
        return;
      }
      if (e.key === "Enter" || e.key === "F2") {
        e.preventDefault();
        optsRef.current.editFirstField(boxId);
        return;
      }
      if (isAddSlotKey(e)) {
        if (optsRef.current.addSlot?.(boxId)) e.preventDefault();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        // The inline editor deletes the box (window listener, after this
        // one); then focus the next box in reading order, or the previous.
        const ids = order();
        const i = ids.indexOf(boxId);
        const neighbour = ids[i + 1] ?? ids[i - 1];
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const svg = svgRef.current;
            if (!svg || svg.querySelector(`g[data-canvas-box-id="${boxId}"]`)) return; // not deleted
            const active = document.activeElement;
            if (active && active !== document.body && document.contains(active)) return;
            const target = neighbour !== undefined && focusBox(neighbour) ? neighbour : order()[0];
            if (target === undefined) return;
            if (target !== neighbour) focusBox(target);
            setCurrent(target);
          })
        );
        return;
      }
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const d = delta[e.key];
      if (!d) return;
      e.preventDefault();
      const el = optsRef.current.elements.find((x) => x.boxId === boxId);
      if (!el || el.kind.name === "function") return; // Frames sit in the call stack.
      if (optsRef.current.gridMove?.(boxId, d[0], d[1])) return;
      const step = e.shiftKey ? ARROW_STEP_LARGE : ARROW_STEP;
      optsRef.current.moveTo(boxId, el.x + d[0] * step, el.y + d[1] * step);
    };
    svg.addEventListener("focusin", onFocusIn);
    svg.addEventListener("keydown", onKeyDown);
    return () => {
      svg.removeEventListener("focusin", onFocusIn);
      svg.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, svgRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // N opens the add-object picker from anywhere in the workspace.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (optsRef.current.editing || (e.key !== "n" && e.key !== "N")) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"], .tutorial-help-backdrop')) return;
      e.preventDefault();
      optsRef.current.openAddPicker();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  /** Focus a just-added box once it is drawn, unless its value editor took focus. */
  const focusNewBox = (boxId: number) => {
    setCurrent(boxId);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (document.activeElement?.tagName !== "INPUT") focusBox(boxId);
      })
    );
  };

  return { focusBox, setCurrent, focusNewBox };
}
