import React, { useMemo, useRef } from "react";
import { CanvasElement } from "../../shared/types";
import { createElementsByIdMap } from "../utils/pythonTutorReferences";
import { detectLinkedListGraph } from "../utils/linkedListDetector";
import LinkedListPreview from "./LinkedListPreview";
import styles from "./StructurePanel.module.css";

interface StructurePanelProps {
  enabled: boolean;
  elements: CanvasElement[];
  collapsed: boolean;
  height: number;
  onCollapsedChange: (collapsed: boolean) => void;
  onHeightChange: (height: number) => void;
}

export default function StructurePanel({
  enabled,
  elements,
  collapsed,
  height,
  onCollapsedChange,
  onHeightChange,
}: StructurePanelProps) {
  const dragRef = useRef<{ y: number; h: number } | null>(null);

  const elementsById = useMemo(() => createElementsByIdMap(elements), [elements]);

  const graph = useMemo(() => {
    if (!enabled) {
      return { nodes: [], edges: [] };
    }

    return detectLinkedListGraph(elements, elementsById);
  }, [enabled, elements, elementsById]);

  if (!enabled || graph.nodes.length === 0) return null;

  const onHandleDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { y: e.clientY, h: height };
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;

      const delta = dragRef.current.y - ev.clientY;
      const next = Math.max(
        110,
        Math.min(window.innerHeight * 0.45, dragRef.current.h + delta)
      );

      onHeightChange(next);
    };

    const onUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return (
    <>
      {!collapsed && (
        <div className={styles.resizeHandle} onMouseDown={onHandleDown} />
      )}

      <div
        className={styles.dock}
        style={{ height: collapsed ? undefined : height }}
      >
        <div className={styles.header}>
          <span className={styles.label}>Linked list visualization</span>

          <button
            type="button"
            className={styles.collapseBtn}
            aria-expanded={!collapsed}
            onClick={() => onCollapsedChange(!collapsed)}
          >
            {collapsed ? "▴" : "▾"}
          </button>
        </div>

        {!collapsed && (
          <div className={styles.body}>
            <LinkedListPreview graph={graph} />
          </div>
        )}
      </div>
    </>
  );
}