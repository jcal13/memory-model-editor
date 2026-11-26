import { useEffect, useRef } from "react";
import { CanvasElement } from "../shared/types";
import { describeChanges } from "../canvas/utils/modelText";
import { announce } from "./announcer";

/**
 * Reads canvas edits out in the live region ("a now refers to id1"). Diffing
 * the elements covers every way of editing: inline, keyboard, drag, undo.
 */
export function useAnnounceChanges(elements: CanvasElement[], inlinePrimitives: boolean) {
  const previous = useRef(elements);
  useEffect(() => {
    const prev = previous.current;
    previous.current = elements;
    if (prev === elements) return;
    describeChanges(prev, elements, { inlinePrimitives }).forEach(announce);
  }, [elements, inlinePrimitives]);
}
