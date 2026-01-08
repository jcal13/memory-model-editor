import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
import { CanvasElement } from "../../shared/types";
import { BoxDimensions } from "../utils/box.types";
import CanvasBox from "./CanvasBox";
import styles from "./CallStack.module.css";

const DEFAULT_BOX_WIDTH = 180;
const FALLBACK_BOX_HEIGHT = 60;
const BOX_GAP = -10;

const HEADER_HEIGHT = 40;
const TOP_FREE_PADDING = 5;
const BOTTOM_FREE_PADDING = -12;
const SELECTION_PADDING_TOP = -25;
const SELECTION_PADDING_BOTTOM = 20;
const TOP_PADDING = TOP_FREE_PADDING + SELECTION_PADDING_TOP;
const BOTTOM_PADDING = BOTTOM_FREE_PADDING + SELECTION_PADDING_BOTTOM + 25;

const SCROLLBAR_WIDTH = 5;
const SCROLLBAR_INSET = 4;
const SCROLLBAR_THUMB_MIN_HEIGHT = 30;
const DRAG_THRESHOLD_PX = 6;

const VERTICAL_OFFSET = 30;

const TOP_CONTROLS_HEIGHT = 120;
const DOWNLOAD_BUTTON_BOTTOM = 35;
const BUTTON_HEIGHT = 38;

interface CallStackProps {
  frames: CanvasElement[];
  selected: CanvasElement | null;
  onSelect: (element: CanvasElement) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  x?: number;
  y?: number;
  width?: number;
}

interface DragState {
  from: number;
  startY: number;
  ghost: SVGGElement;
  origT: string;
  active: boolean;
}

interface LayoutItem {
  f: CanvasElement;
  yLocal: number;
  h: number;
}

const MemoizedCanvasBox = React.memo(CanvasBox);

const CallStack: React.FC<CallStackProps> = ({
  frames,
  selected,
  onSelect,
  onReorder,
  x = 20,
  y = 90,
  width = 205,
}) => {
  const clipPathId = useId();

  // Viewport height management
  const [viewportHeight, setViewportHeight] = useState<number>(() => {
    return window.innerHeight;
  });

  const [centeredY, setCenteredY] = useState<number>(() => {
    const topSpace = TOP_CONTROLS_HEIGHT;
    const bottomSpace = DOWNLOAD_BUTTON_BOTTOM + BUTTON_HEIGHT;
    const availableHeight = window.innerHeight - topSpace - bottomSpace;
    const callStackHeight = window.innerHeight - topSpace - bottomSpace - 20;
    return topSpace + (availableHeight - callStackHeight) / 2;
  });

  const yPosition = y;

  // Box size tracking
  const [boxSizes, setBoxSizes] = useState<Record<number, BoxDimensions>>({});

  const handleBoxSizeChange = useCallback((id: number, size: BoxDimensions) => {
    if (size.width < 1 || size.height < 1) return;

    setBoxSizes((prev) => {
      const current = prev[id];
      if (current?.width === size.width && current?.height === size.height)
        return prev;
      return { ...prev, [id]: size };
    });
  }, []);

  // Layout calculations
  const orderedFrames = useMemo(() => [...frames], [frames]);

  const maxBoxWidth = useMemo(() => {
    return frames.reduce(
      (max, frame) =>
        Math.max(max, boxSizes[frame.boxId]?.width ?? DEFAULT_BOX_WIDTH),
      DEFAULT_BOX_WIDTH
    );
  }, [frames, boxSizes]);

  const columnWidth = Math.max(width, maxBoxWidth);
  const columnHeight =
    viewportHeight - yPosition - (DOWNLOAD_BUTTON_BOTTOM + BUTTON_HEIGHT) - 30;
  const visibleHeight = Math.max(
    100,
    columnHeight - HEADER_HEIGHT - TOP_PADDING - BOTTOM_PADDING
  );

  const layout = useMemo((): LayoutItem[] => {
    let yOffset = 0;
    const baseY = yPosition + HEADER_HEIGHT + TOP_PADDING + visibleHeight;

    return orderedFrames.map((frame) => {
      const height = boxSizes[frame.boxId]?.height ?? FALLBACK_BOX_HEIGHT;
      const yLocal = baseY - yOffset - height / 2;
      yOffset += height + BOX_GAP;
      return { f: frame, yLocal, h: height };
    });
  }, [orderedFrames, boxSizes, yPosition, visibleHeight]);

  const totalContentHeight = layout.reduce(
    (acc, { h }) => acc + h + BOX_GAP,
    0
  );

  // Scrolling state
  const [scrollPosition, setScrollPosition] = useState(0);
  const maxScrollPosition = Math.max(0, totalContentHeight - visibleHeight);
  const [isScrollbarVisible, setIsScrollbarVisible] = useState(false);
  const scrollFadeTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (scrollPosition > maxScrollPosition) {
      setScrollPosition(maxScrollPosition);
    }
  }, [scrollPosition, maxScrollPosition]);

  const handleWheel: React.WheelEventHandler = useCallback(
    (event) => {
      if (maxScrollPosition === 0) return;

      event.preventDefault();
      setScrollPosition((current) =>
        Math.min(maxScrollPosition, Math.max(0, current - event.deltaY))
      );

      setIsScrollbarVisible(true);
      if (scrollFadeTimer.current) clearTimeout(scrollFadeTimer.current);
      scrollFadeTimer.current = setTimeout(
        () => setIsScrollbarVisible(false),
        250
      );
    },
    [maxScrollPosition]
  );

  // Drag and drop state
  const dragState = useRef<DragState | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [dropMarkerY, setDropMarkerY] = useState<number | null>(null);

  const computeDropPosition = useCallback(
    (ghostCenterY: number, draggedIndex: number) => {
      const positions = layout
        .map(({ yLocal, h }, index) => ({
          index,
          top: yLocal + scrollPosition + VERTICAL_OFFSET - h / 2,
          bottom: yLocal + scrollPosition + VERTICAL_OFFSET + h / 2,
        }))
        .filter(({ index }) => index !== draggedIndex)
        .sort((a, b) => a.top - b.top);

      if (positions.length === 0) return null;

      let gap = positions.length;
      for (let i = 0; i < positions.length; i++) {
        if (ghostCenterY < positions[i].top) {
          gap = i;
          break;
        }
      }

      const gapY = gap === 0 ? positions[0].top : positions[gap - 1].bottom;
      return { gap, gapY };
    },
    [layout, scrollPosition]
  );

  const handlePointerDown = useCallback(
    (index: number) => (event: React.PointerEvent<SVGGElement>) => {
      event.preventDefault();
      event.stopPropagation();

      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";

      dragState.current = {
        from: index,
        startY: event.clientY,
        ghost: event.currentTarget,
        origT: event.currentTarget.getAttribute("transform") || "",
        active: false,
      };
    },
    []
  );

  const handlePointerMove: React.PointerEventHandler = useCallback(
    (event) => {
      if (!dragState.current) return;

      const drag = dragState.current;
      const deltaY = event.clientY - drag.startY;

      if (!drag.active && Math.abs(deltaY) > DRAG_THRESHOLD_PX) {
        drag.active = true;
        drag.ghost.setAttribute("opacity", "0.8");
        drag.ghost.setPointerCapture(event.pointerId);
      }

      if (!drag.active) return;

      drag.ghost.setAttribute(
        "transform",
        `${drag.origT} translate(0 ${deltaY})`
      );

      const ghostCenterY =
        layout[drag.from].yLocal + scrollPosition + VERTICAL_OFFSET + deltaY;
      const dropPosition = computeDropPosition(ghostCenterY, drag.from);

      if (!dropPosition) {
        setInsertIndex(null);
        setDropMarkerY(null);
        return;
      }

      setInsertIndex(dropPosition.gap);
      setDropMarkerY(dropPosition.gapY);
    },
    [layout, scrollPosition, computeDropPosition]
  );

  const handlePointerUp: React.PointerEventHandler = useCallback(
    (event) => {
      if (!dragState.current) return;

      const drag = dragState.current;

      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";

      drag.ghost.setAttribute("transform", drag.origT);
      drag.ghost.setAttribute("opacity", "1");

      if (drag.active && insertIndex !== null) {
        const frameCount = layout.length;
        const targetDataIndex =
          insertIndex === frameCount ? 0 : frameCount - 1 - insertIndex;

        if (targetDataIndex !== drag.from) {
          onReorder(drag.from, targetDataIndex);
        }
      }

      setInsertIndex(null);
      setDropMarkerY(null);
      drag.ghost.releasePointerCapture(event.pointerId);
      dragState.current = null;
    },
    [insertIndex, layout.length, onReorder]
  );

  const memoizedElements = useMemo(() => {
    const elementMap: Record<number, CanvasElement> = {};
    orderedFrames.forEach((frame) => {
      elementMap[frame.boxId] = { ...frame, x: 0, y: 0 };
    });
    return elementMap;
  }, [orderedFrames]);

  // Scrollbar calculations
  const scrollbarTrackX = x + columnWidth - SCROLLBAR_WIDTH - SCROLLBAR_INSET;
  const scrollbarTrackY = yPosition + HEADER_HEIGHT - 5;
  const scrollbarTrackHeight = TOP_PADDING + visibleHeight + BOTTOM_PADDING;

  const scrollbarThumbHeight =
    maxScrollPosition === 0
      ? scrollbarTrackHeight
      : Math.max(
          SCROLLBAR_THUMB_MIN_HEIGHT,
          scrollbarTrackHeight * (visibleHeight / totalContentHeight)
        );

  const scrollbarThumbTravel = scrollbarTrackHeight - scrollbarThumbHeight;
  const scrollbarThumbY =
    scrollbarTrackY +
    (maxScrollPosition === 0
      ? 0
      : (1 - scrollPosition / maxScrollPosition) * scrollbarThumbTravel);

  const thumbDragState = useRef({
    isDragging: false,
    startY: 0,
    startScroll: 0,
  });

  const horizontalPadding = maxBoxWidth;

  return (
    <g className={styles.callStackRoot} onWheel={handleWheel}>
      <rect
        className={styles.containerBackground}
        x={x}
        y={yPosition}
        width={columnWidth}
        height={columnHeight}
        rx={10}
        ry={10}
      />

      <text
        className={styles.callStackTitle}
        x={x + columnWidth / 2}
        y={yPosition + 30}
        textAnchor="middle"
      >
        Call&nbsp;Stack
      </text>

      <clipPath id={clipPathId}>
        <rect
          x={x - horizontalPadding}
          y={yPosition + HEADER_HEIGHT}
          width={columnWidth + horizontalPadding * 2}
          height={TOP_PADDING + visibleHeight + BOTTOM_PADDING}
        />
      </clipPath>

      <g
        clipPath={`url(#${clipPathId})`}
        transform={`translate(${x + columnWidth / 2}, 0)`}
      >
        {layout.map(({ f: frame, yLocal, h: height }, index) => (
          <g
            key={frame.boxId}
            transform={`translate(0, ${
              yLocal + scrollPosition + VERTICAL_OFFSET
            })`}
            style={{ cursor: "grab" }}
            onPointerDown={handlePointerDown(index)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {selected?.boxId === frame.boxId &&
              (() => {
                const boxWidth =
                  boxSizes[frame.boxId]?.width ?? DEFAULT_BOX_WIDTH;
                return (
                  <rect
                    className={styles.selectionHighlight}
                    x={-boxWidth / 2 + 1}
                    y={-height / 2 + 2}
                    width={boxWidth - 4}
                    height={height - 6}
                    rx={6}
                    ry={6}
                    style={{ pointerEvents: "none" }}
                  />
                );
              })()}

            <MemoizedCanvasBox
              element={memoizedElements[frame.boxId]}
              openInterface={() => onSelect(frame)}
              updatePosition={() => {}}
              onSizeChange={handleBoxSizeChange}
              invalidated={frame.invalidated}
              disableDrag={true}
            />
          </g>
        ))}

        {dropMarkerY !== null && (
          <rect
            className={styles.dropMarker}
            x={-columnWidth / 2 + 10}
            y={dropMarkerY - 1}
            width={columnWidth - 20}
            height={2}
            rx={1}
            ry={1}
            style={{ pointerEvents: "none" }}
          />
        )}
      </g>

      {maxScrollPosition > 0 && (
        <g
          className={styles.scrollbarContainer}
          style={{ opacity: isScrollbarVisible ? 1 : 0 }}
        >
          <rect
            className={styles.scrollbarTrack}
            x={scrollbarTrackX}
            y={scrollbarTrackY}
            width={SCROLLBAR_WIDTH}
            height={scrollbarTrackHeight}
            rx={SCROLLBAR_WIDTH / 2}
            ry={SCROLLBAR_WIDTH / 2}
          />
          <rect
            className={styles.scrollbarThumb}
            x={scrollbarTrackX}
            y={scrollbarThumbY}
            width={SCROLLBAR_WIDTH}
            height={scrollbarThumbHeight}
            rx={SCROLLBAR_WIDTH / 2}
            ry={SCROLLBAR_WIDTH / 2}
            onPointerDown={(event) => {
              document.body.style.userSelect = "none";
              document.body.style.webkitUserSelect = "none";

              thumbDragState.current = {
                isDragging: true,
                startY: event.clientY,
                startScroll: scrollPosition,
              };
              (event.target as Element).setPointerCapture(event.pointerId);
              setIsScrollbarVisible(true);
            }}
            onPointerMove={(event) => {
              if (!thumbDragState.current.isDragging) return;

              const deltaY = event.clientY - thumbDragState.current.startY;
              const scrollRatio = maxScrollPosition / scrollbarThumbTravel;
              const newScrollPosition = Math.min(
                maxScrollPosition,
                Math.max(
                  0,
                  thumbDragState.current.startScroll + deltaY * scrollRatio
                )
              );

              setScrollPosition(newScrollPosition);
            }}
            onPointerUp={(event) => {
              document.body.style.userSelect = "";
              document.body.style.webkitUserSelect = "";

              thumbDragState.current.isDragging = false;
              (event.target as Element).releasePointerCapture(event.pointerId);
              scrollFadeTimer.current = setTimeout(
                () => setIsScrollbarVisible(false),
                250
              );
            }}
          />
        </g>
      )}
    </g>
  );
};

export default CallStack;
