import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasElement } from "../shared/types";
import { BoxGeom, FieldRef, fieldAtPoint, isRefField } from "./fields";

const DRAG_THRESHOLD_PX = 5;

export interface ConnectState {
  boxId: number;
  field: FieldRef;
  start: { x: number; y: number };
  current: { x: number; y: number };
  /** Past the drag threshold (before that, a press is still a click). */
  active: boolean;
  /** The box under the pointer that the slot can point at, if any. */
  targetBoxId: number | null;
}

export type ConnectDropHandler = (sourceBoxId: number, field: FieldRef, targetBoxId: number) => void;

/**
 * Drag-to-connect: a press on an id slot (or an open id input) that moves
 * past a few pixels becomes a drag; releasing it over a box calls `onDrop`.
 * `suppressClick` swallows the click that follows a completed drag.
 */
export function useConnectGesture({
  measure,
  elementsRef,
  assisted,
  onDrop,
}: {
  measure: (boxId: number) => BoxGeom | null;
  elementsRef: React.MutableRefObject<CanvasElement[]>;
  /** Practice mode: only boxes with ids are targets (Test mode allows `id_`). */
  assisted: boolean;
  onDrop: React.MutableRefObject<ConnectDropHandler>;
}) {
  const [connect, setConnect] = useState<ConnectState | null>(null);
  const connectRef = useRef<ConnectState | null>(null);
  connectRef.current = connect;
  const suppressClick = useRef(false);

  const startConnect = useCallback((boxId: number, field: FieldRef, start: { x: number; y: number }) => {
    setConnect({ boxId, field, start, current: start, active: false, targetBoxId: null });
  }, []);

  const finishConnect = useCallback(() => {
    const c = connectRef.current;
    setConnect(null);
    if (!c || !c.active) return;
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 0);
    if (c.targetBoxId !== null) onDrop.current(c.boxId, c.field, c.targetBoxId);
  }, [onDrop]);

  useEffect(() => {
    if (!connect) return;
    const onMove = (e: PointerEvent) => {
      const c = connectRef.current;
      if (!c) return;
      const dx = e.clientX - c.start.x;
      const dy = e.clientY - c.start.y;
      const active = c.active || dx * dx + dy * dy > DRAG_THRESHOLD_PX ** 2;
      let targetBoxId: number | null = null;
      if (active) {
        const hitEl = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest("[data-canvas-box-id]");
        const id = hitEl ? Number(hitEl.getAttribute("data-canvas-box-id")) : NaN;
        const t = elementsRef.current.find((x) => x.boxId === id);
        const linkable =
          t &&
          t.kind.name !== "function" &&
          (typeof t.id === "number" || (!assisted && t.id === "_"));
        if (t && linkable) targetBoxId = id;
        document.body.style.userSelect = "none";
      }
      setConnect({ ...c, current: { x: e.clientX, y: e.clientY }, active, targetBoxId });
    };
    const onUp = () => {
      document.body.style.userSelect = "";
      finishConnect();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [connect !== null, finishConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Called by a box on pointerdown. Returning true claims the gesture, so the
   * box is not dragged (or a call-stack frame reordered): presses on id slots
   * start a drag-to-connect instead.
   */
  const claimPointerDown = useCallback(
    (el: CanvasElement, ev: PointerEvent | MouseEvent): boolean => {
      if (ev.button !== 0) return false;
      const geom = measure(el.boxId);
      const hit = geom && fieldAtPoint(geom, ev.clientX, ev.clientY);
      if (!hit || !isRefField(hit.ref)) return false;
      startConnect(el.boxId, hit.ref, { x: ev.clientX, y: ev.clientY });
      return true;
    },
    [measure, startConnect]
  );

  return { connect, connectRef, suppressClick, startConnect, claimPointerDown };
}
