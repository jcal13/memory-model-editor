import {
  LinkedListNextKind,
  LinkedListStructure,
  LinkedListGraph,
} from "./linkedListDetector";

const CARD_PADDING_X = 12;
const CARD_PADDING_Y = 8;
const NODE_WIDTH = 110;
const NODE_HEIGHT = 45;
const NODE_GAP = 35;
const VALUE_RATIO = 0.6;
const LABEL_LINE_HEIGHT = 16;
const LABEL_TO_NODE_GAP = 14;
const FOOTER_HEIGHT = 24;
const ROW_GAP = 44;

export interface LinkedListNodeLayout {
  nodeId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dividerX: number;
  dotX: number;
  dotY: number;
  nextCellWidth: number;
  value: string;
  nextText: string;
  labels: string[];
  nextKind: LinkedListNextKind;
}

export interface LinkedListStructureLayout {
  width: number;
  height: number;
  connectorY: number;
  cyclePath: string | null;
  footerText: string | null;
  nodes: LinkedListNodeLayout[];
}

export interface LinkedListGraphLayout {
  width: number;
  height: number;
  connectorY: number;
  nodes: LinkedListNodeLayout[];
  byId: Record<number, LinkedListNodeLayout>;
  edges: {
    fromId: number;
    toId: number;
    kind: "forward" | "backward" | "self";
  }[];
}

function getNextCellText(nextKind: LinkedListNextKind): string {
  switch (nextKind) {
    case "none":
      return "None";
    case "missing":
      return "?";
    case "invalid":
      return "?";
    case "cycle":
      return "•";
    case "node":
    default:
      return "•";
  }
}

function createCyclePath(
  nodes: LinkedListNodeLayout[],
  targetNodeId: number
): string | null {
  const source = nodes[nodes.length - 1];
  const target = nodes.find((node) => node.nodeId === targetNodeId);

  if (!source || !target) {
    return null;
  }

  const startX = source.x + source.width - 8;
  const startY = source.y + source.height / 2;
  const endX = target.x + target.width / 2;
  const endY = target.y - 6;
  const controlY = target.y - 40;

  return `M ${startX} ${startY} C ${startX + 30} ${controlY}, ${endX + 20} ${controlY}, ${endX} ${endY}`;
}

function getFooterText(nextKind: LinkedListNextKind, hasCycle: boolean): string | null {
  if (hasCycle) {
    return "Cycle detected";
  }

  if (nextKind === "missing") {
    return "Chain stopped at a missing reference";
  }

  if (nextKind === "invalid") {
    return "Chain stopped at a non-node next reference";
  }

  return null;
}

export function buildLinkedListGraphLayout(
  graph: LinkedListGraph,
  containerWidth: number
): LinkedListGraphLayout {
  const maxLabelLines = Math.max(
    1,
    ...graph.nodes.map((node) => Math.max(1, node.labels.length))
  );

  const labelBand = maxLabelLines * LABEL_LINE_HEIGHT + LABEL_TO_NODE_GAP;
  const cellW = NODE_WIDTH + NODE_GAP;
  const rowH = labelBand + NODE_HEIGHT + ROW_GAP;

  const usable = Math.max(containerWidth - CARD_PADDING_X * 2, NODE_WIDTH);
  const perRow = Math.max(1, Math.floor((usable + NODE_GAP) / cellW));

  let col = 0;
  let row = 0;
  let prevGroup = graph.nodes.length > 0 ? graph.nodes[0].group : 0;
  let maxCol = 0;

  const nodes: LinkedListNodeLayout[] = graph.nodes.map((node) => {
    if (node.group !== prevGroup || col >= perRow) {
      col = 0;
      row += 1;
      prevGroup = node.group;
    }

    const x = CARD_PADDING_X + col * cellW;
    const y = CARD_PADDING_Y + row * rowH + labelBand;
    const dividerX = x + NODE_WIDTH * VALUE_RATIO;

    if (col + 1 > maxCol) {
      maxCol = col + 1;
    }
    col += 1;

    return {
      nodeId: node.nodeId,
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      dividerX,
      dotX: dividerX + (NODE_WIDTH * (1 - VALUE_RATIO)) / 2,
      dotY: y + NODE_HEIGHT / 2,
      nextCellWidth: NODE_WIDTH * (1 - VALUE_RATIO),
      value: node.value,
      nextText: getNextCellText(node.nextKind),
      labels: node.labels,
      nextKind: node.nextKind,
    };
  });

  const byId: Record<number, LinkedListNodeLayout> = {};
  nodes.forEach((node) => {
    byId[node.nodeId] = node;
  });

  const rowsUsed = graph.nodes.length > 0 ? row + 1 : 1;
  const colsUsed = Math.max(1, maxCol);

  const width = Math.max(
    containerWidth,
    CARD_PADDING_X * 2 + colsUsed * cellW - NODE_GAP
  );
  const height = CARD_PADDING_Y * 2 + rowsUsed * rowH;

  return {
    width,
    height,
    connectorY: 0,
    nodes,
    byId,
    edges: graph.edges.map((edge) => {
      const from = byId[edge.fromId];
      const to = byId[edge.toId];

      if (!from || !to) {
        return { ...edge, kind: "forward" as const };
      }

      if (edge.fromId === edge.toId) {
        return { ...edge, kind: "self" as const };
      }

      const isBackward = to.y > from.y || to.x <= from.x;

      return {
        ...edge,
        kind: isBackward ? "backward" : "forward",
      };
    }),
  };
}

type RectSide = "left" | "right" | "top" | "bottom";

export function getRectPerimeterPoint(
  rect: { x: number; y: number; width: number; height: number },
  toward: { x: number; y: number }
): { point: { x: number; y: number }; side: RectSide } {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;

  if (dx === 0 && dy === 0) {
    return { point: { x: cx, y: cy }, side: "top" };
  }

  const scaleX = dx === 0 ? Infinity : rect.width / 2 / Math.abs(dx);
  const scaleY = dy === 0 ? Infinity : rect.height / 2 / Math.abs(dy);
  const useHorizontalEdge = scaleY < scaleX;
  const side: RectSide = useHorizontalEdge
    ? dy < 0 ? "top" : "bottom"
    : dx < 0 ? "left" : "right";
  const scale = useHorizontalEdge ? scaleY : scaleX;

  return {
    point: { x: cx + dx * scale, y: cy + dy * scale },
    side,
  };
}

export function createEdgePath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  entrySide: RectSide
): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const departVertically = Math.abs(dy) > Math.abs(dx);
  const startOff = Math.max(20, (departVertically ? Math.abs(dy) : Math.abs(dx)) * 0.35);
  const endOff = Math.max(
    20,
    (entrySide === "top" || entrySide === "bottom" ? Math.abs(dy) : Math.abs(dx)) * 0.35
  );

  const c1 = departVertically
    ? { x: start.x, y: start.y + (dy >= 0 ? 1 : -1) * startOff }
    : { x: start.x + (dx >= 0 ? 1 : -1) * startOff, y: start.y };

  const c2 =
    entrySide === "left" ? { x: end.x - endOff, y: end.y }
    : entrySide === "right" ? { x: end.x + endOff, y: end.y }
    : entrySide === "top" ? { x: end.x, y: end.y - endOff }
    : { x: end.x, y: end.y + endOff };

  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
}

export function createReturnEdgePath(
  from: LinkedListNodeLayout,
  to: LinkedListNodeLayout
): string {
  const startX = from.dotX;
  const startY = from.dotY;
  const endX = to.x + to.width / 2;
  const endY = to.y + to.height + 2;
  const sameRow = Math.abs(from.y - to.y) < 1;
  const horizontalGap = from.x - to.x;

  if (sameRow && horizontalGap > 0) {
    const radiusX = Math.max(24, horizontalGap * 0.55);
    const radiusY =
      horizontalGap <= NODE_WIDTH + NODE_GAP + 10 ? 22 : 34;

    return [
      `M ${startX} ${startY}`,
      `A ${radiusX} ${radiusY} 0 0 1 ${endX} ${endY}`,
    ].join(" ");
  }

  const routeY = Math.max(from.y + from.height, to.y + to.height) + 26;
  const c1 = { x: startX + 18, y: routeY };
  const c2 = { x: endX + 10, y: routeY };

  return [
    `M ${startX} ${startY}`,
    `C ${c1.x} ${startY}, ${c1.x} ${routeY}, ${c2.x} ${routeY}`,
    `S ${endX} ${routeY}, ${endX} ${endY}`,
  ].join(" ");
}

export function createSelfLoopPath(node: LinkedListNodeLayout): string {
  const startX = node.dotX;
  const startY = node.dotY;
  const radiusX = 24;
  const radiusY = 28;
  const endX = node.dotX + 2;
  const endY = node.y + 4;

  return [
    `M ${startX} ${startY}`,
    `A ${radiusX} ${radiusY} 0 1 1 ${endX} ${endY}`,
  ].join(" ");
}
