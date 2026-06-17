import React, { useEffect, useId, useRef, useState } from "react";
import styles from "./LinkedListPreview.module.css";
import { LinkedListGraph } from "../utils/linkedListDetector";
import {
  buildLinkedListGraphLayout,
  getRectPerimeterPoint,
  createEdgePath,
} from "../utils/linkedListRenderer";

interface LinkedListPreviewProps {
  graph: LinkedListGraph;
}

export default function LinkedListPreview({ graph }: LinkedListPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const rawId = useId();
  const markerId = `ll-arrow-${rawId.replace(/:/g, "")}`;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (graph.nodes.length === 0) {
    return null;
  }

  const layout = buildLinkedListGraphLayout(graph, containerWidth);

  return (
    <div className={styles.list} ref={containerRef}>
      <svg
        className={styles.diagram}
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label="Linked list visualization"
        preserveAspectRatio="xMinYMin meet"
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="9"
            markerHeight="9"
            orient="auto-start-reverse"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0 0 L10 5 L0 10 z" className={styles.arrowFill} />
          </marker>
        </defs>

        {layout.edges.map((edge) => {
          const from = layout.byId[edge.fromId];
          const to = layout.byId[edge.toId];
          if (!from || !to) return null;

          const start = { x: from.dotX, y: from.dotY };
          const end = getRectPerimeterPoint(
            { x: to.x, y: to.y, width: to.width, height: to.height },
            start
          );
          const d = createEdgePath(start, end.point, end.side);

          return (
            <path
              key={`${edge.fromId}-${edge.toId}`}
              d={d}
              fill="none"
              className={styles.linkLine}
              markerEnd={`url(#${markerId})`}
            />
          );
        })}

        {layout.nodes.map((node) => (
          <g key={node.nodeId}>
            {node.labels.map((label, labelIndex) => {
              const lx = node.x + node.width / 2;
              const labelY =
                node.y - 16 - (node.labels.length - 1 - labelIndex) * 14;
              const isBottomLabel = labelIndex === node.labels.length - 1;

              return (
                <g key={`${node.nodeId}-${label}`}>
                  <text
                    x={lx}
                    y={labelY}
                    textAnchor="middle"
                    className={styles.label}
                  >
                    {label}
                  </text>
                  {isBottomLabel && (
                    <path
                      d={`M ${lx} ${labelY + 4} L ${lx} ${node.y - 1}`}
                      fill="none"
                      className={styles.linkLine}
                      markerEnd={`url(#${markerId})`}
                    />
                  )}
                </g>
              );
            })}

            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              className={styles.nodeRect}
            />
            <line
              x1={node.dividerX}
              y1={node.y}
              x2={node.dividerX}
              y2={node.y + node.height}
              className={styles.divider}
            />
            <text
              x={(node.x + node.dividerX) / 2}
              y={node.y + node.height / 2}
              textAnchor="middle"
              dominantBaseline="central"
              className={styles.nodeValue}
            >
              {node.value}
            </text>

            {node.nextText === "•" ? (
              <circle
                cx={node.dotX}
                cy={node.y + node.height / 2}
                r={2.5}
                className={styles.dot}
              />
            ) : node.nextText === "None" ? (
              <>
                <path
                  d={`M ${node.dotX} ${node.y + node.height / 2} L ${node.x + node.width + 22} ${node.y + node.height / 2}`}
                  fill="none"
                  className={styles.linkLine}
                  markerEnd={`url(#${markerId})`}
                />
                <text
                  x={node.x + node.width + 28}
                  y={node.y + node.height / 2}
                  textAnchor="start"
                  dominantBaseline="central"
                  className={styles.nextLabel}
                >
                  None
                </text>
              </>
            ) : (
              <text
                x={(node.dividerX + node.x + node.width) / 2}
                y={node.y + node.height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className={styles.nextLabel}
                textLength={node.nextCellWidth - 6}
                lengthAdjust="spacingAndGlyphs"
              >
                {node.nextText}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}