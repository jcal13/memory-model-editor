import { useEffect, useRef, useState } from "react";
import { screenToCanvas } from "../../shared/uiScale";
import AddObjectPicker, { ADD_CHOICES } from "../components/AddObjectPicker";
import { findFreeSpot } from "../utils/freeSpot";

type Point = { x: number; y: number };

/** Primitives have no boxes of their own when Python Tutor draws values inline. */
const PRIMITIVE_CHOICES = ["int", "float", "str", "bool", "none"];

/**
 * Adding a box without the mouse: `N` opens the "Add object" picker, and the
 * palette's Enter/Space go through the same path. A new box goes to the first
 * first clear spot right of the call stack.
 */
export function useKeyboardAdd({
  svgRef,
  addBox,
  inlinePrimitives,
  onKeyboardAddReady,
  onAdded,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>;
  /** Adds a box of this palette type at canvas coordinates; its boxId, or null. */
  addBox: (boxType: string, coords: Point) => number | null;
  inlinePrimitives: boolean;
  /** Hands the add function to the palette (Enter/Space on a palette box). */
  onKeyboardAddReady?: (add: (boxType: string) => void) => void;
  onAdded: (boxId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const choices = inlinePrimitives
    ? ADD_CHOICES.filter((c) => !PRIMITIVE_CHOICES.includes(c.boxType))
    : ADD_CHOICES;

  const add = (boxType: string) => {
    setOpen(false);
    const svg = svgRef.current;
    if (!svg) return;
    const spot = findFreeSpot(svg);
    const coords = spot && screenToCanvas(svg, spot.x, spot.y);
    if (!coords) return;
    const boxId = addBox(boxType, coords);
    if (boxId !== null) onAdded(boxId);
  };

  const addRef = useRef(add);
  addRef.current = add;
  useEffect(() => {
    onKeyboardAddReady?.((boxType) => addRef.current(boxType));
  }, [onKeyboardAddReady]);

  return {
    openPicker: () => setOpen(true),
    picker: open ? (
      <AddObjectPicker choices={choices} onPick={add} onClose={() => setOpen(false)} />
    ) : null,
  };
}
