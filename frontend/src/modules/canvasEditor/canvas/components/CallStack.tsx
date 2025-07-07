import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
import { CanvasElement } from "../../shared/types";
import CanvasBox from "./CanvasBox";

const BOX_WIDTH = 200;
const FALLBACK_H = 60;
const GAP = 0;

const LABEL_H = 40;
const TOP_FREE_PAD = 12;
const BOTTOM_FREE_PAD = 12;
const SEL_PAD_TOP = 25;
const SEL_PAD_BOTTOM = 20;
const TOP_PAD = TOP_FREE_PAD + SEL_PAD_TOP;
const BOTTOM_PAD = BOTTOM_FREE_PAD + SEL_PAD_BOTTOM;

const TRACK_W = 5;
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

const MemoCanvasBox = React.memo(CanvasBox);

const CallStack: React.FC<Props> = ({
  frames,
  selected,
  onSelect,
  x = 20,
  y = 80,
  width = 230,
}) => {
  const clipId = useId();

  const [viewportH, setViewportH] = useState(
    typeof window !== "undefined" ? window.innerHeight - 110 : 800
  );
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight - 110);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const ordered = useMemo(
    () => [...frames].sort((a, b) => (a.boxId as number) - (b.boxId as number)),
    [frames]
  );

  const [boxHeights, setBoxHeights] = useState<Record<number, number>>({});
  const handleSizeChange = useCallback((id: number, h: number) => {
    if (h < 1) return;
    setBoxHeights((p) => (p[id] === h ? p : { ...p, [id]: h }));
  }, []);

  const columnHeight = viewportH - y - 10;
  const visibleWinHeight = columnHeight - LABEL_H - TOP_PAD - BOTTOM_PAD;

  const layout = useMemo(() => {
    let offset = 0;
    const baseY = y + LABEL_H + TOP_PAD + visibleWinHeight - FALLBACK_H / 2;
    return ordered.map((frame) => {
      let h = boxHeights[frame.boxId] ?? FALLBACK_H;
      h = h - 15;
      const yLocal = baseY - offset - h / 2 + 50;
      offset += h + GAP;
      return { frame, yLocal, h };
    });
  }, [ordered, boxHeights, y, visibleWinHeight]);

  const totalStackHeight = useMemo(() => {
    if (!ordered.length) return 0;
    return layout[0]
      ? layout.reduce((acc, { h }) => acc + h + GAP - 9, -GAP)
      : 0;
  }, [layout]);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const maxScroll = Math.max(0, totalStackHeight - visibleWinHeight);

  useEffect(() => {
    setScrollOffset((o) => Math.min(maxScroll, Math.max(0, o)));
  }, [maxScroll]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (maxScroll === 0) return;
      e.preventDefault();
      const next = scrollOffset - e.deltaY;
      setScrollOffset(Math.min(maxScroll, Math.max(0, next)));
      setIsScrolling(true);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setIsScrolling(false), 250);
    },
    [scrollOffset, maxScroll]
  );

  const trackX = x + width - TRACK_W - TRACK_INSET;
  const trackY = y + LABEL_H - 5;
  const trackH = TOP_PAD + visibleWinHeight + BOTTOM_PAD;
  const thumbH =
    maxScroll === 0
      ? trackH
      : Math.max(THUMB_MIN_H, trackH * (visibleWinHeight / totalStackHeight));
  const thumbTravel = trackH - thumbH;
  const thumbY =
    trackY +
    (maxScroll === 0 ? 0 : (1 - scrollOffset / maxScroll) * thumbTravel);

  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const startOffset = useRef(0);

  const onThumbDown = (e: React.PointerEvent) => {
    if (maxScroll === 0) return;
    dragging.current = true;
    setIsScrolling(true);
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
    scrollTimeout.current = setTimeout(() => setIsScrolling(false), 250);
  };

  const memoElements = useMemo(() => {
    const map: Record<number, CanvasElement> = {};
    ordered.forEach((f) => {
      map[f.boxId] = { ...f, x: 0, y: 0 };
    });
    return map;
  }, [ordered]);

  const H_PAD = BOX_WIDTH / 2;

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
        y={y + 30}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        pointerEvents="none"
        style={{
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
          color: "#1f2937",
        }}
      >
        Call&nbsp;Stack
      </text>
      <clipPath id={clipId}>
        <rect
          x={x - H_PAD - 50}
          y={y + LABEL_H}
          width={width + H_PAD * 2}
          height={TOP_PAD + visibleWinHeight + BOTTOM_PAD}
        />
      </clipPath>
      <g
        clipPath={`url(#${clipId})`}
        transform={`translate(${x + width / 2}, 0)`}
      >
        {layout.map(({ frame, yLocal, h }) => (
          <g
            key={frame.boxId}
            transform={`translate(0, ${yLocal + scrollOffset})`}
          >
            {selected?.boxId === frame.boxId && (
              <rect
                x={-(BOX_WIDTH / 2) - 4}
                y={-h / 2 - SEL_PAD_TOP + 23}
                width={BOX_WIDTH + 5}
                height={h + SEL_PAD_TOP + SEL_PAD_BOTTOM - 44}
                rx={6}
                ry={6}
                fill="none"
                stroke="#1d4ed8"
                strokeWidth={2}
              />
            )}

            <MemoCanvasBox
              element={memoElements[frame.boxId]}
              openInterface={() => onSelect(frame)}
              updatePosition={() => {}}
              onSizeChange={handleSizeChange}
            />
          </g>
        ))}
      </g>
      scrollbar
      {maxScroll > 0 && (
        <g
          opacity={isScrolling ? 1 : 0}
          style={{ transition: "opacity 0.3s ease" }}
        >
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
        </g>
      )}
    </g>
  );
};

export default CallStack;
