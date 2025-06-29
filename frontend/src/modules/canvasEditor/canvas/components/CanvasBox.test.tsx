import React from "react";
import { render } from "@testing-library/react";
import CanvasBox from "./CanvasBox";
import { BoxProps } from "../utils/BoxProps";

/**
 * Mocks the global SVG <g> element and its methods
 * to simulate the environment where CanvasBox operates.
 */
const gElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
const svgContainer = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "svg"
);
svgContainer.appendChild(gElement);

const gRefMock = {
  current: gElement,
};

// Mocks the useGlobalRefs hook to provide necessary references
jest.mock("../hooks/useRef", () => ({
  useGlobalRefs: () => ({
    gRef: gRefMock,
    isDragging: { current: false },
    start: { current: { x: 0, y: 0 } },
    origin: { current: { x: 100, y: 200 } },
    halfSize: { current: { w: 50, h: 30 } },
  }),
}));

// Mocks the useDraggableBox hook
const useDraggableBoxMock = jest.fn();
jest.mock("../hooks/useEffect", () => ({
  useDraggableBox: (props: any) => useDraggableBoxMock(props),
}));

const mockElement = {
  boxId: 0,
  id: 1,
  x: 100,
  y: 200,
  kind: {
    name: "primitive" as const,
    type: "int" as const,
    value: "42",
  },
};

const mockOpenInterface = jest.fn();
const mockUpdatePosition = jest.fn();

const baseProps: BoxProps = {
  element: mockElement,
  openInterface: mockOpenInterface,
  updatePosition: mockUpdatePosition,
};

describe("CanvasBox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Renders an SVG <g> element and ensures it's present in the DOM
   */
  it("renders an SVG <g> element", () => {
    const { container } = render(
      <svg>
        <CanvasBox {...baseProps} />
      </svg>
    );
    const g = container.querySelector("g");
    expect(g).toBeInTheDocument();
  });

  /**
   * Verifies that useDraggableBox is called with the correct props
   */
  it("calls useDraggableBox with expected parameters", () => {
    render(
      <svg>
        <CanvasBox {...baseProps} />
      </svg>
    );
    expect(useDraggableBoxMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gRef: gRefMock,
        element: mockElement,
        openInterface: mockOpenInterface,
        updatePosition: mockUpdatePosition,
        isDragging: expect.any(Object),
        start: expect.any(Object),
        origin: expect.any(Object),
        halfSize: expect.any(Object),
      })
    );
  });

  /**
   * Verifies that the element prop is passed correctly to useDraggableBox
   */
  it("passes element prop to useDraggableBox correctly", () => {
    render(
      <svg>
        <CanvasBox {...baseProps} />
      </svg>
    );
    const lastCall = useDraggableBoxMock.mock.calls[0][0];
    expect(lastCall.element).toEqual(mockElement);
  });

  /**
   * Handles missing `openInterface` and `updatePosition` without crashing
   */
  it("handles missing openInterface and updatePosition safely", () => {
    const safeProps = {
      ...baseProps,
      openInterface: undefined as any,
      updatePosition: undefined as any,
    };
    render(
      <svg>
        <CanvasBox {...safeProps} />
      </svg>
    );
    const lastCall = useDraggableBoxMock.mock.calls[0][0];
    expect(lastCall.openInterface).toBeUndefined();
    expect(lastCall.updatePosition).toBeUndefined();
  });
});
