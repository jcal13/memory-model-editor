import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { CanvasElement } from "../../shared/types";
import CanvasBox from "./CanvasBox";

const BOX_WIDTH = 200;
const BOX_HEIGHT = 60;
const GAP = 31;

const LABEL_H = 40;
const TOP_FREE_PAD = 12;
const BOTTOM_FREE_PAD = 12;

const SEL_PAD_TOP = 25;
const SEL_PAD_BOTTOM = 20;

const TOP_PAD = TOP_FREE_PAD + SEL_PAD_TOP;
const BOTTOM_PAD = BOTTOM_FREE_PAD + SEL_PAD_BOTTOM;

const TRACK_W = 8;
const TRACK_INSET = 4;
const THUMB_MIN_H = 30;

interface Props {
  frames: CanvasElement[];
  selected: CanvasElement | null;
  onSelect: (el: CanvasElement) => void;
  x?: number;
  y?: number;
  width?: number;
}

const CallStack: React.FC<Props> = ({
  frames,
  selected,
  onSelect,
  x = 20,
  y = 80,
  width = 230,
}) => {
  const [viewportH, setViewportH] = useState(
    typeof window !== "undefined" ? window.innerHeight - 110 : 800
  );
  useEffect(() => {
    const h = () => setViewportH(window.innerHeight);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const columnHeight = viewportH - y - 10;
  const visibleWinHeight = columnHeight - LABEL_H - TOP_PAD - BOTTOM_PAD;

  const ordered = useMemo(
    () => [...frames].sort((a, b) => (a.boxId as number) - (b.boxId as number)),
    [frames]
  );

  const totalStackHeight = ordered.length
    ? ordered.length * (BOX_HEIGHT + GAP) - GAP
    : 0;

  const maxScroll = Math.max(0, totalStackHeight - visibleWinHeight);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    setScrollOffset((o) => Math.min(maxScroll, Math.max(0, o)));
  }, [maxScroll]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (maxScroll === 0) return;
      e.preventDefault();
      const next = scrollOffset - e.deltaY;
      setScrollOffset(Math.min(maxScroll, Math.max(0, next)));
    },
    [scrollOffset, maxScroll]
  );

  const trackX = x + width - TRACK_W - TRACK_INSET;
  const trackY = y + LABEL_H;
  const trackH = TOP_PAD + visibleWinHeight + BOTTOM_PAD;

  const thumbH =
    maxScroll === 0
      ? trackH
      : Math.max(THUMB_MIN_H, trackH * (visibleWinHeight / totalStackHeight));
  const thumbTravel = trackH - thumbH;
  const thumbY =
    trackY + (maxScroll === 0 ? 0 : (scrollOffset / maxScroll) * thumbTravel);

  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const startOffset = useRef(0);

  const onThumbDown = (e: React.PointerEvent) => {
    if (maxScroll === 0) return;
    dragging.current = true;
    dragStartY.current = e.clientY;
    startOffset.current = scrollOffset;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onThumbMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dy = e.clientY - dragStartY.current;
    const ratio = maxScroll / thumbTravel;
    const next = startOffset.current + dy * ratio;
    setScrollOffset(Math.min(maxScroll, Math.max(0, next)));
  };

  const onThumbUp = (e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  const bottomCenter =
    y + LABEL_H + TOP_PAD + visibleWinHeight - BOX_HEIGHT / 2;

  return (
    <g onWheel={handleWheel}>
      <rect
        x={x}
        y={y}
        width={width}
        height={columnHeight}
        rx={10}
        ry={10}
        fill="#fafafa"
        stroke="#666"
        strokeWidth={1}
        opacity={0.95}
      />

      <text
        x={x + width / 2}
        y={y + 25}
        textAnchor="middle"
        fontSize={14}
        fontWeight="bold"
        pointerEvents="none"
      >
        Call&nbsp;Stack
      </text>

      <clipPath id="callstack-clip">
        <rect
          x={x}
          y={y + LABEL_H}
          width={width}
          height={TOP_PAD + visibleWinHeight + BOTTOM_PAD}
        />
      </clipPath>

      <g clipPath="url(#callstack-clip)">
        {ordered.map((frame, idx) => {
          const yPos = bottomCenter - idx * (BOX_HEIGHT + GAP) + scrollOffset;
          const isSel = selected?.boxId === frame.boxId;
          const miniEl: CanvasElement = { ...frame, x: 0, y: 0 };

          return (
            <g
              key={frame.boxId}
              transform={`translate(${x + width / 2}, ${yPos})`}
              style={{ cursor: "pointer" }}
            >
              {isSel && (
                <rect
                  x={-(BOX_WIDTH / 2) - 4}
                  y={-BOX_HEIGHT / 2 - SEL_PAD_TOP}
                  width={BOX_WIDTH + 5}
                  height={BOX_HEIGHT + SEL_PAD_TOP + SEL_PAD_BOTTOM + 5}
                  rx={6}
                  ry={6}
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                />
              )}

              <CanvasBox
                element={miniEl}
                openInterface={() => onSelect(frame)}
                updatePosition={() => {}}
              />
            </g>
          );
        })}
      </g>

      {maxScroll > 0 && (
        <>
          <rect
            x={trackX}
            y={trackY}
            width={TRACK_W}
            height={trackH}
            rx={TRACK_W / 2}
            ry={TRACK_W / 2}
            fill="#e0e0e0"
          />
          <rect
            x={trackX}
            y={thumbY}
            width={TRACK_W}
            height={thumbH}
            rx={TRACK_W / 2}
            ry={TRACK_W / 2}
            fill="#7c7c7c"
            style={{ cursor: "pointer" }}
            onPointerDown={onThumbDown}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
          />
        </>
      )}
    </g>
  );
};

export default CallStack;
