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
import styles from "../styles/CallStack.module.css";

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
const DRAG_PX = 6;

interface Props {
  frames: CanvasElement[];
  selected: CanvasElement | null;
  onSelect: (el: CanvasElement) => void;
  onReorder: (from: number, to: number) => void;
  x?: number;
  y?: number;
  width?: number;
}

const MemoCanvasBox = React.memo(CanvasBox);

const CallStack: React.FC<Props> = ({
  frames,
  selected,
  onSelect,
  onReorder,
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

  const ordered = useMemo(() => [...frames], [frames]);

  const [boxSizes, setBoxSizes] = useState<
    Record<number, { w: number; h: number }>
  >({});
  const handleSizeChange = useCallback(
    (id: number, s: { w: number; h: number }) => {
      if (s.w < 1 || s.h < 1) return;
      setBoxSizes((p) =>
        p[id]?.w === s.w && p[id]?.h === s.h ? p : { ...p, [id]: s }
      );
    },
    []
  );

  const maxBoxW = useMemo(
    () => Object.values(boxSizes).reduce((m, s) => Math.max(m, s.w), BOX_WIDTH),
    [boxSizes]
  );
  const colW = Math.max(width, maxBoxW);
  const columnH = viewportH - y - 10;
  const visibleH = columnH - LABEL_H - TOP_PAD - BOTTOM_PAD;

  const layout = useMemo(() => {
    let offset = 0;
    const baseY = y + LABEL_H + TOP_PAD + visibleH - FALLBACK_H / 2;
    return ordered.map((f) => {
      const h = (boxSizes[f.boxId]?.h ?? FALLBACK_H) - 15;
      const yLocal = baseY - offset - h / 2 + 50;
      offset += h + GAP;
      return { f, yLocal, h } as const;
    });
  }, [ordered, boxSizes, y, visibleH]);

  const totalH = layout.reduce((acc, { h }) => acc + h + GAP - 9, -GAP);

  const [scroll, setScroll] = useState(0);
  const maxScroll = Math.max(0, totalH - visibleH);

  const [isScrolling, setScrolling] = useState(false);
  const fadeTimer = useRef<NodeJS.Timeout | null>(null);
  const onWheel: React.WheelEventHandler = (e) => {
    if (maxScroll === 0) return;
    e.preventDefault();
    setScroll((s) => Math.min(maxScroll, Math.max(0, s - e.deltaY)));
    setScrolling(true);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => setScrolling(false), 250);
  };

  type Drag = null | {
    from: number;
    startY: number;
    ghost: SVGGElement;
    origT: string;
    rowH: number;
    active: boolean;
  };

  const dragRef = useRef<Drag>(null);
  const [insertIdx, setInsertIdx] = useState<number | null>(null);
  const [markerY, setMarkerY] = useState<number | null>(null);

  const computeInsert = (ghostCenter: number) => {
    const positions = layout.map(({ yLocal, h }, arrayIndex) => ({
      arrayIndex,
      visualTop: yLocal + scroll,
      visualBottom: yLocal + scroll + h,
    }));

    positions.sort((a, b) => a.visualTop - b.visualTop);

    let insert = positions.length;
    for (let i = 0; i < positions.length; i++) {
      if (ghostCenter < positions[i].visualTop) {
        insert = i;
        break;
      }
    }

    let gapY: number;
    if (insert === 0) {
      gapY = positions[0].visualTop;
    } else if (insert === positions.length) {
      gapY = positions[positions.length - 1].visualBottom;
    } else {
      gapY = positions[insert].visualTop;
    }

    return { idx: insert, gapY };
  };

  const onRowDown =
    (idx: number, h: number) => (e: React.PointerEvent<SVGGElement>) => {
      dragRef.current = {
        from: idx,
        startY: e.clientY,
        ghost: e.currentTarget,
        origT: e.currentTarget.getAttribute("transform") || "",
        rowH: h,
        active: false,
      };
    };

  const onRowMove: React.PointerEventHandler = (e) => {
    if (!dragRef.current) return;
    const st = dragRef.current;
    const dy = e.clientY - st.startY;

    if (!st.active && Math.abs(dy) > DRAG_PX) {
      st.active = true;
      st.ghost.setAttribute("opacity", "0.8");
      st.ghost.setPointerCapture(e.pointerId);
    }
    if (!st.active) return;

    st.ghost.setAttribute("transform", `${st.origT} translate(0 ${dy})`);

    const ghostCenter = layout[st.from].yLocal + scroll + dy;
    const { idx, gapY } = computeInsert(ghostCenter);
    setInsertIdx(idx);
    setMarkerY(gapY);
  };

  const onRowUp: React.PointerEventHandler = (e) => {
    if (!dragRef.current) return;
    const st = dragRef.current;

    st.ghost.setAttribute("transform", st.origT);
    st.ghost.setAttribute("opacity", "1");

    if (st.active && insertIdx !== null) {
      const toIdx =
        insertIdx >= layout.length ? 0 : layout.length - 1 - insertIdx;

      if (toIdx !== st.from) {
        onReorder(st.from, toIdx);
      }
    }
    setInsertIdx(null);
    setMarkerY(null);
    st.ghost.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  };

  const memoEls = useMemo(() => {
    const m: Record<number, CanvasElement> = {};
    ordered.forEach((f) => (m[f.boxId] = { ...f, x: 0, y: 0 }));
    return m;
  }, [ordered]);

  const trackX = x + colW - TRACK_W - TRACK_INSET;
  const trackY = y + LABEL_H - 5;
  const trackH = TOP_PAD + visibleH + BOTTOM_PAD;
  const thumbH =
    maxScroll === 0
      ? trackH
      : Math.max(THUMB_MIN_H, trackH * (visibleH / totalH));
  const thumbTravel = trackH - thumbH;
  const thumbY =
    trackY + (maxScroll === 0 ? 0 : (1 - scroll / maxScroll) * thumbTravel);

  const thumbDrag = useRef(false);
  const thumbStartY = useRef(0);
  const thumbStartScroll = useRef(0);

  const H_PAD = BOX_WIDTH / 2;

  return (
    <g className={styles.root} onWheel={onWheel}>
      <rect
        className={styles.containerRect}
        x={x}
        y={y}
        width={colW}
        height={columnH}
        rx={10}
        ry={10}
      />

      <text
        className={styles.title}
        x={x + colW / 2}
        y={y + 30}
        textAnchor="middle"
      >
        Call&nbsp;Stack
      </text>

      <clipPath id={clipId}>
        <rect
          x={x - H_PAD - 100}
          y={y + LABEL_H}
          width={colW + H_PAD * 2}
          height={TOP_PAD + visibleH + BOTTOM_PAD}
        />
      </clipPath>

      <g
        clipPath={`url(#${clipId})`}
        transform={`translate(${x + colW / 2},0)`}
      >
        {layout.map(({ f, yLocal, h }, idx) => (
          <g
            key={f.boxId}
            transform={`translate(0, ${yLocal + scroll})`}
            cursor="grab"
            onPointerDown={onRowDown(idx, h)}
            onPointerMove={onRowMove}
            onPointerUp={onRowUp}
          >
            {selected?.boxId === f.boxId &&
              (() => {
                const w = boxSizes[f.boxId]?.w ?? BOX_WIDTH;
                return (
                  <rect
                    className={styles.selectedRect}
                    x={-w / 2 + 6}
                    y={-h / 2 - SEL_PAD_TOP + 23}
                    width={w - 14}
                    height={h + SEL_PAD_TOP + SEL_PAD_BOTTOM - 44}
                    rx={6}
                    ry={6}
                    pointerEvents="none"
                  />
                );
              })()}

            <MemoCanvasBox
              element={memoEls[f.boxId]}
              openInterface={() => onSelect(f)}
              updatePosition={() => {}}
              onSizeChange={handleSizeChange}
            />
          </g>
        ))}

        {markerY !== null && (
          <rect
            className={styles.markerLine}
            x={-colW / 2 + 10}
            y={markerY - 1}
            width={colW - 20}
            height={2}
            rx={1}
            ry={1}
            pointerEvents="none"
          />
        )}
      </g>

      {maxScroll > 0 && (
        <g className={styles.scrollbarGroup} opacity={isScrolling ? 1 : 0}>
          <rect
            className={styles.track}
            x={trackX}
            y={trackY}
            width={TRACK_W}
            height={trackH}
            rx={TRACK_W / 2}
            ry={TRACK_W / 2}
          />
          <rect
            className={styles.thumb}
            x={trackX}
            y={thumbY}
            width={TRACK_W}
            height={thumbH}
            rx={TRACK_W / 2}
            ry={TRACK_W / 2}
            onPointerDown={(e) => {
              thumbDrag.current = true;
              (e.target as Element).setPointerCapture(e.pointerId);
              thumbStartY.current = e.clientY;
              thumbStartScroll.current = scroll;
              setScrolling(true);
            }}
            onPointerMove={(e) => {
              if (!thumbDrag.current) return;
              const dy = e.clientY - thumbStartY.current;
              const ratio = maxScroll / thumbTravel;
              setScroll(
                Math.min(
                  maxScroll,
                  Math.max(0, thumbStartScroll.current + dy * ratio)
                )
              );
            }}
            onPointerUp={(e) => {
              thumbDrag.current = false;
              (e.target as Element).releasePointerCapture(e.pointerId);
              fadeTimer.current = setTimeout(() => setScrolling(false), 250);
            }}
          />
        </g>
      )}
    </g>
  );
};

export default CallStack;
