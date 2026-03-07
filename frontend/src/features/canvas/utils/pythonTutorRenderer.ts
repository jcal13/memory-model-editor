import {
  CanvasElement,
  ClassKind,
  DictKind,
  FunctionKind,
  ListKind,
  PrimitiveKind,
  RenderMode,
  SetKind,
  TupleKind,
} from "../../shared/types";
import {
  formatPrimitiveValue,
  getPythonTutorDisplayType,
  getPythonTutorFrameTitle,
  resolveInlineDisplay,
  PythonTutorReferenceDisplay,
} from "./pythonTutorReferences";

const SVG_NS = "http://www.w3.org/2000/svg";
const FONT_FAMILY = 'Consolas, "Courier New", monospace';
const LABEL_Y = 10;
const OBJECT_TOP = 20;
const PADDING_X = 10;
const ROW_HEIGHT = 30;
const SLOT_HEIGHT = 28;
const CELL_HEIGHT = 56;
const CELL_MIN_WIDTH = 52;
const VALUE_FONT_SIZE = 16;
const LABEL_FONT_SIZE = 12;
const INDEX_FONT_SIZE = 11;

const COLORS = {
  objectFill: "var(--python-tutor-box-bg)",
  border: "var(--python-tutor-border)",
  labelText: "var(--python-tutor-header-text)",
  bodyText: "var(--python-tutor-body-text)",
  referenceText: "var(--python-tutor-reference-text)",
  frameLine: "var(--python-tutor-frame-line)",
};

interface RenderContext {
  elementsById?: Map<number, CanvasElement>;
  renderMode?: RenderMode;
}

interface KeyValueRow {
  left: string;
  right: PythonTutorReferenceDisplay;
}

function createSvg(width: number, height: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("width", `${width}`);
  svg.setAttribute("height", `${height}`);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.overflow = "visible";
  svg.style.display = "block";
  return svg;
}

function createNode<T extends keyof SVGElementTagNameMap>(
  tag: T
): SVGElementTagNameMap[T] {
  return document.createElementNS(SVG_NS, tag);
}

function appendRect(
  svg: SVGSVGElement,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    fill: string;
    stroke?: string;
    strokeWidth?: number;
    rx?: number;
    ry?: number;
    opacity?: number;
  }
): SVGRectElement {
  const rect = createNode("rect");
  rect.setAttribute("x", `${x}`);
  rect.setAttribute("y", `${y}`);
  rect.setAttribute("width", `${width}`);
  rect.setAttribute("height", `${height}`);
  rect.setAttribute("rx", `${options.rx ?? 1}`);
  rect.setAttribute("ry", `${options.ry ?? 1}`);
  rect.style.fill = options.fill;
  rect.style.stroke = options.stroke ?? "none";
  rect.style.strokeWidth = `${options.strokeWidth ?? 0}`;
  if (typeof options.opacity === "number") {
    rect.style.opacity = `${options.opacity}`;
  }
  svg.appendChild(rect);
  return rect;
}

function appendLine(
  svg: SVGSVGElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = COLORS.border,
  strokeWidth: number = 1
): void {
  const line = createNode("line");
  line.setAttribute("x1", `${x1}`);
  line.setAttribute("y1", `${y1}`);
  line.setAttribute("x2", `${x2}`);
  line.setAttribute("y2", `${y2}`);
  line.style.stroke = color;
  line.style.strokeWidth = `${strokeWidth}`;
  svg.appendChild(line);
}

function appendText(
  svg: SVGSVGElement,
  text: string,
  x: number,
  y: number,
  options: {
    fill?: string;
    fontSize?: number;
    fontWeight?: string;
    anchor?: "start" | "middle" | "end";
  } = {}
): SVGTextElement {
  const node = createNode("text");
  node.textContent = text;
  node.setAttribute("x", `${x}`);
  node.setAttribute("y", `${y}`);
  node.setAttribute("text-anchor", options.anchor ?? "start");
  node.setAttribute("dominant-baseline", "middle");
  node.style.fontFamily = FONT_FAMILY;
  node.style.fontSize = `${options.fontSize ?? 14}px`;
  node.style.fontWeight = options.fontWeight ?? "400";
  node.style.fill = options.fill ?? COLORS.bodyText;
  svg.appendChild(node);
  return node;
}

function appendBounds(svg: SVGSVGElement, width: number, height: number): void {
  appendRect(svg, 0, 0, width, height, {
    fill: "transparent",
    strokeWidth: 0,
    rx: 0,
    ry: 0,
    opacity: 0,
  });
}

function appendReferenceHitRect(
  svg: SVGSVGElement,
  x: number,
  y: number,
  width: number,
  height: number,
  targetId: number | null
): void {
  if (targetId === null) return;

  const rect = appendRect(svg, x, y, width, height, {
    fill: "transparent",
    strokeWidth: 0,
    rx: 0,
    ry: 0,
    opacity: 0,
  });
  rect.setAttribute("data-ref-target-id", `${targetId}`);
}

function measureText(text: string, fontSize: number = 14): number {
  return text.length * fontSize * 0.61;
}

function getReferenceColor(display: PythonTutorReferenceDisplay): string {
  return display.kind === "reference" || display.kind === "unknown"
    ? COLORS.referenceText
    : COLORS.bodyText;
}

function isClickableReference(display: PythonTutorReferenceDisplay): boolean {
  return display.kind === "reference";
}

function getIdLabel(element: CanvasElement): string {
  return typeof element.id === "number" ? `id${element.id}` : "";
}

function getObjectLabel(title: string, idLabel: string): string {
  return idLabel ? `${title} ${idLabel}` : title;
}

function appendObjectLabel(
  svg: SVGSVGElement,
  title: string,
  idLabel: string
): void {
  appendText(svg, getObjectLabel(title, idLabel), 2, LABEL_Y, {
    fill: COLORS.labelText,
    fontSize: LABEL_FONT_SIZE,
  });
}

function appendObjectShell(
  svg: SVGSVGElement,
  width: number,
  height: number
): void {
  appendRect(svg, 0, OBJECT_TOP, width, height, {
    fill: COLORS.objectFill,
    stroke: COLORS.border,
    strokeWidth: 1.25,
    rx: 1,
    ry: 1,
  });
}

function appendFrameBracket(
  svg: SVGSVGElement,
  x: number,
  y: number,
  height: number
): void {
  appendLine(svg, x, y, x, y + height, COLORS.frameLine, 1);
  appendLine(svg, x, y, x + 10, y, COLORS.frameLine, 1);
  appendLine(svg, x, y + height, x + 10, y + height, COLORS.frameLine, 1);
}

function appendFrameSlot(
  svg: SVGSVGElement,
  display: PythonTutorReferenceDisplay,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  appendFrameBracket(svg, x, y, height);

  if (!display.label) {
    return;
  }

  appendText(svg, display.label, x + 16, y + height / 2, {
    fill: getReferenceColor(display),
    fontSize: VALUE_FONT_SIZE,
  });

  if (!isClickableReference(display)) {
    return;
  }

  const textWidth = measureText(display.label, VALUE_FONT_SIZE);
  appendReferenceHitRect(
    svg,
    x,
    y - 2,
    Math.max(width, textWidth + 18),
    height + 4,
    display.targetId
  );
}

function renderFrameBox(
  element: CanvasElement & { kind: FunctionKind },
  context: RenderContext
): SVGSVGElement {
  const rows = (element.kind.params || []).map((param) => ({
    left: param.name,
    right: resolveInlineDisplay(param.targetId, context.elementsById),
  }));
  const bodyRows =
    rows.length > 0
      ? rows
      : [{ left: "", right: resolveInlineDisplay(null, context.elementsById) }];
  const title = getPythonTutorFrameTitle(element.kind.functionName);
  const leftWidth = Math.max(
    44,
    ...bodyRows.map((row) => measureText(row.left || "", 17))
  );
  const rightWidth = Math.max(
    46,
    ...bodyRows.map((row) => measureText(row.right.label, VALUE_FONT_SIZE))
  );
  const slotWidth = Math.max(44, rightWidth + 18);
  const width = Math.max(
    context.renderMode === "palette" ? 172 : 150,
    measureText(title, 18) + 8,
    leftWidth + slotWidth + 34
  );
  const height = 28 + bodyRows.length * 40;
  const svg = createSvg(width, height);

  appendBounds(svg, width, height);
  appendText(svg, title, 0, 14, {
    fill: COLORS.bodyText,
    fontSize: 18,
  });

  bodyRows.forEach((row, index) => {
    const rowTop = 28 + index * 40;
    const slotX = leftWidth + 18;

    appendText(svg, row.left, 0, rowTop + 18, {
      fill: COLORS.bodyText,
      fontSize: 16,
    });
    appendFrameSlot(svg, row.right, slotX, rowTop + 4, slotWidth, SLOT_HEIGHT);
  });

  return svg;
}

function renderPrimitiveBox(element: CanvasElement): SVGSVGElement {
  const primitiveKind = element.kind as PrimitiveKind;
  const title = getPythonTutorDisplayType(element);
  const idLabel = getIdLabel(element);
  const label = getObjectLabel(title, idLabel);
  const value = formatPrimitiveValue(primitiveKind);
  const width = Math.max(
    84,
    measureText(label, LABEL_FONT_SIZE) + 8,
    measureText(value, 18) + 26
  );
  const height = OBJECT_TOP + 44;
  const svg = createSvg(width, height);

  appendBounds(svg, width, height);
  appendObjectLabel(svg, title, idLabel);
  appendObjectShell(svg, width, 44);
  appendText(svg, value, width / 2, OBJECT_TOP + 22, {
    anchor: "middle",
    fill: COLORS.bodyText,
    fontSize: 18,
  });

  return svg;
}

function renderSequenceBox(
  element: CanvasElement & { kind: ListKind | TupleKind | SetKind },
  context: RenderContext
): SVGSVGElement {
  const values = Array.isArray(element.kind.value) ? element.kind.value : [];
  const displays = values.map((value) =>
    resolveInlineDisplay(value, context.elementsById)
  );
  const label = getObjectLabel(
    getPythonTutorDisplayType(element),
    getIdLabel(element)
  );
  const hasIndexes =
    element.kind.name === "list" || element.kind.name === "tuple";
  const cellWidths = displays.map((display) =>
    Math.max(CELL_MIN_WIDTH, measureText(display.label, VALUE_FONT_SIZE) + 22)
  );
  const bodyWidth =
    cellWidths.length > 0
      ? cellWidths.reduce((sum, cellWidth) => sum + cellWidth, 0)
      : 72;
  const width = Math.max(
    context.renderMode === "palette" ? 150 : 130,
    bodyWidth,
    measureText(label, LABEL_FONT_SIZE) + 8
  );
  const height = OBJECT_TOP + CELL_HEIGHT;
  const svg = createSvg(width, height);

  appendBounds(svg, width, height);
  appendObjectLabel(svg, getPythonTutorDisplayType(element), getIdLabel(element));
  appendObjectShell(svg, width, CELL_HEIGHT);

  if (displays.length === 0) {
    return svg;
  }

  let currentX = 0;
  displays.forEach((display, index) => {
    const cellWidth = cellWidths[index];

    if (index > 0) {
      appendLine(svg, currentX, OBJECT_TOP, currentX, OBJECT_TOP + CELL_HEIGHT);
    }

    if (hasIndexes) {
      appendText(svg, `${index}`, currentX + 7, OBJECT_TOP + 10, {
        fill: COLORS.labelText,
        fontSize: INDEX_FONT_SIZE,
      });
    }

    appendText(
      svg,
      display.label,
      currentX + cellWidth / 2,
      OBJECT_TOP + 32,
      {
        anchor: "middle",
        fill: getReferenceColor(display),
        fontSize: VALUE_FONT_SIZE,
      }
    );

    if (isClickableReference(display)) {
      appendReferenceHitRect(
        svg,
        currentX,
        OBJECT_TOP,
        cellWidth,
        CELL_HEIGHT,
        display.targetId
      );
    }

    currentX += cellWidth;
  });

  return svg;
}

function renderDictBox(
  element: CanvasElement & { kind: DictKind },
  context: RenderContext
): SVGSVGElement {
  const rows = Object.entries(element.kind.value || {}).map(([key, value]) => ({
    left: resolveInlineDisplay(key, context.elementsById),
    right: resolveInlineDisplay(value, context.elementsById),
  }));
  const bodyRows =
    rows.length > 0
      ? rows
      : [
          {
            left: resolveInlineDisplay(null, context.elementsById),
            right: resolveInlineDisplay(null, context.elementsById),
          },
        ];
  const label = getObjectLabel("dict", getIdLabel(element));
  const leftWidth = Math.max(
    50,
    ...bodyRows.map((row) => measureText(row.left.label, 14) + 12)
  );
  const rightWidth = Math.max(
    50,
    ...bodyRows.map((row) => measureText(row.right.label, 14) + 12)
  );
  const dividerGap = 12;
  const width = Math.max(
    context.renderMode === "palette" ? 156 : 136,
    leftWidth + rightWidth + dividerGap,
    measureText(label, LABEL_FONT_SIZE) + 8
  );
  const height = OBJECT_TOP + Math.max(1, bodyRows.length) * ROW_HEIGHT;
  const leftColumnWidth = Math.max(50, (width - dividerGap) / 2);
  const rightStart = leftColumnWidth + dividerGap;
  const rightColumnWidth = width - rightStart;
  const dividerX = leftColumnWidth + dividerGap / 2;
  const svg = createSvg(width, height);

  appendBounds(svg, width, height);
  appendObjectLabel(svg, "dict", getIdLabel(element));
  appendObjectShell(svg, width, Math.max(1, bodyRows.length) * ROW_HEIGHT);
  appendLine(svg, dividerX, OBJECT_TOP, dividerX, height);

  bodyRows.forEach((row, index) => {
    const rowTop = OBJECT_TOP + index * ROW_HEIGHT;
    if (index > 0) {
      appendLine(svg, 0, rowTop, width, rowTop);
    }

    appendText(
      svg,
      row.left.label,
      leftColumnWidth / 2,
      rowTop + ROW_HEIGHT / 2,
      {
        anchor: "middle",
        fill: getReferenceColor(row.left),
        fontSize: 14,
      }
    );
    appendText(
      svg,
      row.right.label,
      rightStart + rightColumnWidth / 2,
      rowTop + ROW_HEIGHT / 2,
      {
        anchor: "middle",
        fill: getReferenceColor(row.right),
        fontSize: 14,
      }
    );

    if (isClickableReference(row.left)) {
      appendReferenceHitRect(
        svg,
        0,
        rowTop,
        leftColumnWidth,
        ROW_HEIGHT,
        row.left.targetId
      );
    }

    if (isClickableReference(row.right)) {
      appendReferenceHitRect(
        svg,
        rightStart,
        rowTop,
        rightColumnWidth,
        ROW_HEIGHT,
        row.right.targetId
      );
    }
  });

  return svg;
}

function renderKeyValueObjectBox(
  title: string,
  idLabel: string,
  rows: KeyValueRow[],
  renderMode: RenderMode = "canvas"
): SVGSVGElement {
  const bodyRows =
    rows.length > 0
      ? rows
      : [{ left: "", right: resolveInlineDisplay(null) }];
  const label = getObjectLabel(title, idLabel);
  const leftWidth = Math.max(
    52,
    ...bodyRows.map((row) => measureText(row.left, 14) + 10)
  );
  const rightWidth = Math.max(
    58,
    ...bodyRows.map((row) => measureText(row.right.label, 14) + 14)
  );
  const width = Math.max(
    renderMode === "palette" ? 170 : 144,
    leftWidth + rightWidth + PADDING_X * 2,
    measureText(label, LABEL_FONT_SIZE) + 8
  );
  const height = OBJECT_TOP + Math.max(1, bodyRows.length) * ROW_HEIGHT;
  const dividerX = Math.max(PADDING_X + leftWidth, width * 0.45);
  const svg = createSvg(width, height);

  appendBounds(svg, width, height);
  appendObjectLabel(svg, title, idLabel);
  appendObjectShell(svg, width, Math.max(1, bodyRows.length) * ROW_HEIGHT);
  appendLine(svg, dividerX, OBJECT_TOP, dividerX, height);

  bodyRows.forEach((row, index) => {
    const rowTop = OBJECT_TOP + index * ROW_HEIGHT;
    if (index > 0) {
      appendLine(svg, 0, rowTop, width, rowTop);
    }

    appendText(svg, row.left, PADDING_X, rowTop + ROW_HEIGHT / 2, {
      fill: COLORS.bodyText,
      fontSize: 14,
    });
    appendText(
      svg,
      row.right.label,
      dividerX + 8,
      rowTop + ROW_HEIGHT / 2,
      {
        fill: getReferenceColor(row.right),
        fontSize: 14,
      }
    );

    if (isClickableReference(row.right)) {
      appendReferenceHitRect(
        svg,
        dividerX,
        rowTop,
        width - dividerX,
        ROW_HEIGHT,
        row.right.targetId
      );
    }
  });

  return svg;
}

function renderClassBox(
  element: CanvasElement & { kind: ClassKind },
  context: RenderContext
): SVGSVGElement {
  const rows = (element.kind.classVariables || []).map((variable) => ({
    left: variable.name,
    right: resolveInlineDisplay(variable.targetId, context.elementsById),
  }));

  return renderKeyValueObjectBox(
    element.kind.className || "object",
    getIdLabel(element),
    rows,
    context.renderMode
  );
}

function getFunctionSignature(element: CanvasElement & { kind: FunctionKind }): string {
  const name = element.kind.functionName || "function";
  const params = (element.kind.params || [])
    .map((param) => param.name || "_")
    .join(", ");
  return `${name}(${params})`;
}

function renderFunctionObjectBox(
  element: CanvasElement & { kind: FunctionKind },
  context: RenderContext
): SVGSVGElement {
  const label = getObjectLabel("function", getIdLabel(element));
  const signature = getFunctionSignature(element);
  const width = Math.max(
    context.renderMode === "palette" ? 150 : 132,
    measureText(label, LABEL_FONT_SIZE) + 8,
    measureText(signature, 18) + 8
  );
  const height = OBJECT_TOP + 24;
  const svg = createSvg(width, height);

  appendBounds(svg, width, height);
  appendText(svg, label, 2, LABEL_Y, {
    fill: COLORS.labelText,
    fontSize: LABEL_FONT_SIZE,
  });
  appendText(svg, signature, 0, OBJECT_TOP + 14, {
    fill: COLORS.bodyText,
    fontSize: 18,
  });

  return svg;
}

export function createPythonTutorBoxRenderer(
  element: CanvasElement,
  context: RenderContext = {}
): SVGSVGElement {
  switch (element.kind.name) {
    case "primitive":
      return renderPrimitiveBox(element);
    case "function":
      return typeof element.id === "number"
        ? renderFunctionObjectBox(
            element as CanvasElement & { kind: FunctionKind },
            context
          )
        : renderFrameBox(element as CanvasElement & { kind: FunctionKind }, context);
    case "list":
    case "tuple":
    case "set":
      return renderSequenceBox(
        element as CanvasElement & { kind: ListKind | TupleKind | SetKind },
        context
      );
    case "dict":
      return renderDictBox(element as CanvasElement & { kind: DictKind }, context);
    case "class":
      return renderClassBox(element as CanvasElement & { kind: ClassKind }, context);
    default:
      return renderPrimitiveBox(element);
  }
}
