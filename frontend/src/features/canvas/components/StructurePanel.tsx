import React, { useMemo, useRef } from "react";
import { CanvasElement } from "../../shared/types";
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

function LinkedListContent({ elements }: { elements: CanvasElement[] }) {
  const graph = useMemo(() => detectLinkedListGraph(elements), [elements]);
  return graph.nodes.length === 0 ? (
    <p role="status">No linked lists detected.</p>
  ) : (
    <LinkedListPreview graph={graph} />
  );
}

function StructurePanelContent({
  elements,
  collapsed,
  height,
  onCollapsedChange,
  onHeightChange,
}: StructurePanelProps) {
  const dragRef = useRef<{ y: number; h: number } | null>(null);

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
            aria-label={collapsed ? "Expand visualization" : "Collapse visualization"}
            aria-expanded={!collapsed}
            onClick={() => onCollapsedChange(!collapsed)}
          >
            {collapsed ? "▴" : "▾"}
          </button>
        </div>

        {!collapsed && (
          <div className={styles.body}>
            <StructurePanelBoundary elements={elements}>
              <LinkedListContent elements={elements} />
            </StructurePanelBoundary>
          </div>
        )}
      </div>
    </>
  );
}

interface StructurePanelBoundaryProps {
  elements: CanvasElement[];
  children: React.ReactNode;
}

interface StructurePanelBoundaryState {
  failed: boolean;
  elements: CanvasElement[];
}

// Keep both detection and rendering inside the boundary so either can fail
// without unmounting the surrounding editor.
class StructurePanelBoundary extends React.Component<
  StructurePanelBoundaryProps,
  StructurePanelBoundaryState
> {
  state: StructurePanelBoundaryState = {
    failed: false,
    elements: this.props.elements,
  };

  static getDerivedStateFromError(): Partial<StructurePanelBoundaryState> {
    return { failed: true };
  }

  static getDerivedStateFromProps(
    props: StructurePanelBoundaryProps,
    state: StructurePanelBoundaryState
  ): Partial<StructurePanelBoundaryState> | null {
    // Retry after an edit, undo/redo, or question change supplies a new canvas.
    return props.elements !== state.elements
      ? { elements: props.elements, failed: false }
      : null;
  }

  render() {
    if (this.state.failed) {
      return (
        <p role="status">
          Visualization unavailable. You can keep editing your canvas.
        </p>
      );
    }

    return this.props.children;
  }
}

export default function StructurePanel(props: StructurePanelProps) {
  // Unmounting the boundary also lets switching the visualizer off/on retry.
  if (!props.enabled) return null;

  return <StructurePanelContent {...props} />;
}
