import { useEffect } from "react";
import { createBoxRenderer } from "../utils/BoxRenderer";
import { CanvasElement, SubmissionResult, Tab } from "../../shared/types";

/**
 * Syncs the given ref with the current `dataType` state on every change.
 */
export const useDataType = (
  dataTypeRef: React.MutableRefObject<any>,
  dataType: any
) => {
  useEffect(() => {
    dataTypeRef.current = dataType;
  }, [dataType]);
};

/**
 * Syncs the given ref with the current `contentValue` state on every change.
 */
export const useContentValue = (
  contentValueRef: React.MutableRefObject<any>,
  contentValue: any
) => {
  useEffect(() => {
    contentValueRef.current = contentValue;
  }, [contentValue]);
};

/**
 * Sets and updates the SVG viewBox based on container size.
 * Automatically adjusts on window resize.
 */
export const useCanvasResize = (
  svgRef: any,
  setViewBox: (vb: string) => void
) => {
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const recalc = () => {
      const { width, height } = svg.getBoundingClientRect();
      setViewBox(`0 0 ${width} ${height}`);
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [svgRef, setViewBox]);
};

// =========================
// Draggable Canvas Box Hook
// =========================

interface DraggableParams {
  gRef: any;
  element: any;
  halfSize: any;
  openInterface: any;
  isDragging: any;
  start: any;
  origin: any;
  updatePosition: (x: number, y: number) => void;
  invalidated?: boolean;
}

/**
 * Enables drag interaction and overlay click handling for a <g> SVG box.
 */
export const useDraggableBox = ({
  gRef,
  element,
  halfSize,
  openInterface,
  isDragging,
  start,
  origin,
  updatePosition,
  invalidated = false,
}: DraggableParams) => {
  // Converts mouse coordinates to SVG coordinates
  const getSvgPoint = (e: MouseEvent | React.MouseEvent) => {
    const svg = gRef.current!.ownerSVGElement!;
    const pt = svg.createSVGPoint();
    pt.x = (e as MouseEvent).clientX ?? (e as React.MouseEvent).clientX;
    pt.y = (e as MouseEvent).clientY ?? (e as React.MouseEvent).clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };

  // Handles starting a drag
  const onMouseDown = (e: MouseEvent | React.MouseEvent) => {
    e.stopPropagation();
    isDragging.current = true;
    const pt = getSvgPoint(e);
    start.current = { x: pt.x, y: pt.y };
    origin.current = { x: element.x, y: element.y };
    window.addEventListener("mousemove", onMouseMove as any);
    window.addEventListener("mouseup", onMouseUp as any);
  };

  // Handles dragging movement
  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const pt = getSvgPoint(e);
    const dx = pt.x - start.current.x;
    const dy = pt.y - start.current.y;

    const svg = gRef.current!.ownerSVGElement!;
    const vb = svg.viewBox.baseVal;
    const { w, h } = halfSize.current;

    const clamp = (val: number, min: number, max: number) =>
      Math.min(Math.max(val, min), max);

    const newX = clamp(origin.current.x + dx, vb.x + w, vb.x + vb.width - w);
    const newY = clamp(origin.current.y + dy, vb.y + h, vb.y + vb.height - h);
    updatePosition(newX, newY);
  };

  // Ends dragging
  const onMouseUp = () => {
    isDragging.current = false;
    window.removeEventListener("mousemove", onMouseMove as any);
    window.removeEventListener("mouseup", onMouseUp as any);
  };

  // Initialize box render and overlay
  useEffect(() => {
    if (!gRef.current) return;

    // Render SVG element
    const svgElement = createBoxRenderer(element);
    const padding = 12;

    // Reset container
    gRef.current.innerHTML = "";
    gRef.current.appendChild(svgElement);

    const texts = Array.from(
      svgElement.querySelectorAll<SVGElement>("text, tspan")
    );
    const shapes = Array.from(
      svgElement.querySelectorAll<SVGElement>(
        "rect,path,polygon,ellipse,circle"
      )
    ).filter((el) => !el.closest("defs") && !el.hasAttribute("data-overlay"));

    [...shapes, ...texts].forEach((s) => {
      s.style.removeProperty("stroke");
      s.style.removeProperty("fill");
      s.style.removeProperty("filter");
      s.style.removeProperty("fill-opacity");
    });

    const COLOUR = "#9CA3AF";
    if (invalidated) {
      shapes.forEach((s) => s.style.setProperty("stroke", COLOUR, "important"));
      texts.forEach((t) => t.style.setProperty("fill", COLOUR, "important"));
    }

    // Calculate dimensions
    const bbox = svgElement.getBBox();
    const width = bbox.width + padding * 2;
    const height = bbox.height + padding * 2;

    svgElement.setAttribute(
      "viewBox",
      `-${padding} -${padding} ${width} ${height}`
    );
    svgElement.setAttribute("width", `${width}`);
    svgElement.setAttribute("height", `${height}`);

    halfSize.current = { w: width / 2, h: height / 2 };

    gRef.current.setAttribute(
      "transform",
      `translate(${element.x - halfSize.current.w}, ${
        element.y - halfSize.current.h
      })`
    );

    // Transparent overlay for dragging and clicking
    const overlay = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    overlay.setAttribute("x", `-${padding}`);
    overlay.setAttribute("y", `-${padding}`);
    overlay.setAttribute("width", `${width}`);
    overlay.setAttribute("height", `${height}`);
    overlay.setAttribute("fill", "transparent");
    overlay.setAttribute("data-overlay", "true");
    overlay.style.cursor = "grab";

    const clickHandler = (e: MouseEvent) => {
      e.stopPropagation();
      openInterface(element);
    };

    overlay.addEventListener("mousedown", onMouseDown as any);
    overlay.addEventListener("click", clickHandler as any);

    svgElement.appendChild(overlay);

    // Cleanup on re-render/unmount
    return () => {
      overlay.removeEventListener("mousedown", onMouseDown as any);
      overlay.removeEventListener("click", clickHandler as any);
    };
  }, [element, invalidated]);
};

const LS_KEY = "canvas_key";

export function useCanvasLocalStorage({
  elements,
  ids,
  classes,
}: {
  elements: CanvasElement[];
  ids: number[];
  classes: string[];
}) {
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ elements, ids, classes }));
    } catch {}
  }, [elements, ids, classes]);
}

export function clearCanvasStorage() {
  localStorage.removeItem(LS_KEY);
}

export const loadInitial = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { elements: [], ids: [], classes: [] };
    const parsed = JSON.parse(raw);
    return {
      elements: Array.isArray(parsed?.elements) ? parsed.elements : [],
      ids: Array.isArray(parsed?.ids) ? parsed.ids : [],
      classes: Array.isArray(parsed?.classes) ? parsed.classes : [],
    };
  } catch {
    return { elements: [], ids: [], classes: [] };
  }
};

const UI_LS_KEY = "canvas_ui_state_v3";

export type UIState = {
  activeTab: Tab;
  questionIndex: number | null;
  questionType: "test" | "practice" | null;
  submissionResults: SubmissionResult;
  sandboxMode: boolean | null;
};

export function loadUIInitial(): UIState {
  try {
    const raw = localStorage.getItem(UI_LS_KEY);
    if (!raw) {
      return {
        activeTab: "question",
        questionIndex: null,
        questionType: null,
        submissionResults: null,
        sandboxMode: null,
      };
    }
    const parsed = JSON.parse(raw);

    const activeTab: Tab =
      parsed?.activeTab === "feedback" ? "feedback" : "question";

    const questionIndex =
      typeof parsed?.questionIndex === "number" ? parsed.questionIndex : null;

    const questionType =
      parsed?.questionType === "test" || parsed?.questionType === "practice"
        ? parsed.questionType
        : null;

    const sr = parsed?.submissionResults;
    const submissionResults: SubmissionResult =
      sr && typeof sr === "object"
        ? {
            correct: !!sr.correct,
            errors: Array.isArray(sr.errors)
              ? sr.errors
              : Array.isArray(sr.messages)
              ? sr.messages
              : [],
          }
        : null;

    const sandboxMode: boolean | null =
      typeof parsed?.sandboxMode === "boolean" ? parsed.sandboxMode : null;

    return {
      activeTab,
      questionIndex,
      questionType,
      submissionResults,
      sandboxMode,
    };
  } catch {
    return {
      activeTab: "question",
      questionIndex: null,
      questionType: null,
      submissionResults: null,
      sandboxMode: null,
    };
  }
}

/** Persist UI state (tab, question, mode, feedback, sandbox) under the NEW key */
export function useUILocalStorage(state: UIState) {
  const {
    activeTab,
    questionIndex,
    questionType,
    submissionResults,
    sandboxMode,
  } = state;

  useEffect(() => {
    try {
      localStorage.setItem(
        UI_LS_KEY,
        JSON.stringify({
          activeTab,
          questionIndex,
          questionType,
          submissionResults,
          sandboxMode,
        })
      );
    } catch {}
  }, [activeTab, questionIndex, questionType, submissionResults, sandboxMode]);
}

export function loadSavedQuestionView(): string {
  try {
    const raw = localStorage.getItem(UI_LS_KEY);
    if (!raw) return "root";
    const parsed = JSON.parse(raw);
    const v = parsed?.questionView;
    return v === "loading" || v === "list" || v === "question" ? v : "root";
  } catch {
    return "root";
  }
}

export function usePersistQuestionView(view: string) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(UI_LS_KEY);
      const parsed = raw ? JSON.parse(raw) || {} : {};
      parsed.questionView = view;
      localStorage.setItem(UI_LS_KEY, JSON.stringify(parsed));
    } catch {}
  }, [view]);
}
