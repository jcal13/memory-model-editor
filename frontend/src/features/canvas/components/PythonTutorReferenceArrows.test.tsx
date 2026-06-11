import React, { useRef } from "react";
import { render, waitFor } from "@testing-library/react";
import PythonTutorReferenceArrows from "./PythonTutorReferenceArrows";

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

function makeRect(
  left: number,
  top: number,
  width: number,
  height: number
): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

function Harness({
  enabled,
  includePrimitiveTargets = false,
  targetKind = "class",
}: {
  enabled: boolean;
  includePrimitiveTargets?: boolean;
  targetKind?: "class" | "primitive";
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  return (
    <svg ref={svgRef} viewBox="0 0 400 300">
      <g
        data-canvas-element-id="2"
        data-canvas-kind={targetKind}
        data-canvas-render-mode="canvas"
      />
      <circle data-ref-source-target-id="2" />
      <PythonTutorReferenceArrows
        svgRef={svgRef}
        enabled={enabled}
        includePrimitiveTargets={includePrimitiveTargets}
        elements={[]}
      />
    </svg>
  );
}

function parseCubicPath(pathData: string) {
  const matches = pathData.match(/-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length !== 8) {
    throw new Error(`Unexpected path data: ${pathData}`);
  }

  const [startX, startY, control1X, control1Y, control2X, control2Y, endX, endY] =
    matches.map(Number);

  return {
    startX,
    startY,
    control1X,
    control1Y,
    control2X,
    control2Y,
    endX,
    endY,
  };
}

describe("PythonTutorReferenceArrows", () => {
  beforeAll(() => {
    (global as typeof globalThis).ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
    window.requestAnimationFrame = ((callback: FrameRequestCallback) =>
      window.setTimeout(callback, 0)) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = ((handle: number) =>
      window.clearTimeout(handle)) as typeof window.cancelAnimationFrame;
  });

  it("draws arrow paths only when enabled and source/target markers exist", async () => {
    const { container, rerender } = render(<Harness enabled={false} />);

    const svg = container.querySelector("svg") as SVGSVGElement;
    const target = container.querySelector(
      '[data-canvas-element-id="2"]'
    ) as SVGGElement;
    const source = container.querySelector(
      '[data-ref-source-target-id="2"]'
    ) as SVGCircleElement;

    svg.getBoundingClientRect = () => makeRect(0, 0, 400, 300);
    target.getBoundingClientRect = () => makeRect(240, 120, 80, 60);
    source.getBoundingClientRect = () => makeRect(100, 140, 8, 8);

    expect(
      container.querySelector('g[data-python-tutor-arrow-overlay="true"] path')
    ).toBeNull();

    rerender(<Harness enabled={true} />);

    const rerenderedSvg = container.querySelector("svg") as SVGSVGElement;
    const rerenderedTarget = container.querySelector(
      '[data-canvas-element-id="2"]'
    ) as SVGGElement;
    const rerenderedSource = container.querySelector(
      '[data-ref-source-target-id="2"]'
    ) as SVGCircleElement;

    rerenderedSvg.getBoundingClientRect = () => makeRect(0, 0, 400, 300);
    rerenderedTarget.getBoundingClientRect = () => makeRect(240, 120, 80, 60);
    rerenderedSource.getBoundingClientRect = () => makeRect(100, 140, 8, 8);

    await waitFor(() => {
      const arrowPath = container.querySelector(
        'g[data-python-tutor-arrow-overlay="true"] path'
      );
      expect(arrowPath).not.toBeNull();
      expect(arrowPath?.getAttribute("d")).toContain("M");
    });
  });

  it("uses a vertical endpoint tangent when entering from above", async () => {
    const { container } = render(<Harness enabled={true} />);

    const svg = container.querySelector("svg") as SVGSVGElement;
    const target = container.querySelector(
      '[data-canvas-element-id="2"]'
    ) as SVGGElement;
    const source = container.querySelector(
      '[data-ref-source-target-id="2"]'
    ) as SVGCircleElement;

    svg.getBoundingClientRect = () => makeRect(0, 0, 400, 300);
    target.getBoundingClientRect = () => makeRect(160, 160, 80, 60);
    source.getBoundingClientRect = () => makeRect(196, 40, 8, 8);

    await waitFor(() => {
      const arrowPath = container.querySelector(
        'g[data-python-tutor-arrow-overlay="true"] path'
      );
      expect(arrowPath).not.toBeNull();

      const path = parseCubicPath(arrowPath?.getAttribute("d") || "");
      expect(path.control2X).toBeCloseTo(path.endX, 5);
      expect(path.control2Y).not.toBeCloseTo(path.endY, 5);
      expect(path.endY).toBeCloseTo(160, 5);
    });
  });

  it("uses a vertical endpoint tangent when entering from below", async () => {
    const { container } = render(<Harness enabled={true} />);

    const svg = container.querySelector("svg") as SVGSVGElement;
    const target = container.querySelector(
      '[data-canvas-element-id="2"]'
    ) as SVGGElement;
    const source = container.querySelector(
      '[data-ref-source-target-id="2"]'
    ) as SVGCircleElement;

    svg.getBoundingClientRect = () => makeRect(0, 0, 400, 300);
    target.getBoundingClientRect = () => makeRect(160, 80, 80, 60);
    source.getBoundingClientRect = () => makeRect(196, 220, 8, 8);

    await waitFor(() => {
      const arrowPath = container.querySelector(
        'g[data-python-tutor-arrow-overlay="true"] path'
      );
      expect(arrowPath).not.toBeNull();

      const path = parseCubicPath(arrowPath?.getAttribute("d") || "");
      expect(path.control2X).toBeCloseTo(path.endX, 5);
      expect(path.control2Y).not.toBeCloseTo(path.endY, 5);
      expect(path.endY).toBeCloseTo(140, 5);
    });
  });

  it("keeps a horizontal endpoint tangent when entering from the left", async () => {
    const { container } = render(<Harness enabled={true} />);

    const svg = container.querySelector("svg") as SVGSVGElement;
    const target = container.querySelector(
      '[data-canvas-element-id="2"]'
    ) as SVGGElement;
    const source = container.querySelector(
      '[data-ref-source-target-id="2"]'
    ) as SVGCircleElement;

    svg.getBoundingClientRect = () => makeRect(0, 0, 400, 300);
    target.getBoundingClientRect = () => makeRect(240, 120, 80, 60);
    source.getBoundingClientRect = () => makeRect(100, 140, 8, 8);

    await waitFor(() => {
      const arrowPath = container.querySelector(
        'g[data-python-tutor-arrow-overlay="true"] path'
      );
      expect(arrowPath).not.toBeNull();

      const path = parseCubicPath(arrowPath?.getAttribute("d") || "");
      expect(path.control2X).not.toBeCloseTo(path.endX, 5);
      expect(path.control2Y).toBeCloseTo(path.endY, 5);
      expect(path.endX).toBeCloseTo(240, 5);
    });
  });

  it("includes primitive targets only when configured", async () => {
    const { container, rerender } = render(
      <Harness enabled={true} targetKind="primitive" />
    );

    const svg = container.querySelector("svg") as SVGSVGElement;
    const target = container.querySelector(
      '[data-canvas-element-id="2"]'
    ) as SVGGElement;
    const source = container.querySelector(
      '[data-ref-source-target-id="2"]'
    ) as SVGCircleElement;

    svg.getBoundingClientRect = () => makeRect(0, 0, 400, 300);
    target.getBoundingClientRect = () => makeRect(240, 120, 80, 60);
    source.getBoundingClientRect = () => makeRect(100, 140, 8, 8);

    await waitFor(() => {
      expect(
        container.querySelector('g[data-python-tutor-arrow-overlay="true"] path')
      ).toBeNull();
    });

    rerender(
      <Harness
        enabled={true}
        includePrimitiveTargets={true}
        targetKind="primitive"
      />
    );

    const rerenderedSvg = container.querySelector("svg") as SVGSVGElement;
    const rerenderedTarget = container.querySelector(
      '[data-canvas-element-id="2"]'
    ) as SVGGElement;
    const rerenderedSource = container.querySelector(
      '[data-ref-source-target-id="2"]'
    ) as SVGCircleElement;

    rerenderedSvg.getBoundingClientRect = () => makeRect(0, 0, 400, 300);
    rerenderedTarget.getBoundingClientRect = () => makeRect(240, 120, 80, 60);
    rerenderedSource.getBoundingClientRect = () => makeRect(100, 140, 8, 8);

    await waitFor(() => {
      expect(
        container.querySelector('g[data-python-tutor-arrow-overlay="true"] path')
      ).not.toBeNull();
    });
  });
});
