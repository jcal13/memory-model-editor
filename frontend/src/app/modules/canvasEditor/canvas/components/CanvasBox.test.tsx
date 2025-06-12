import React from "react";
import { render } from "@testing-library/react";
import CanvasBox from "./CanvasBox";
import { BoxProps } from "../utils/BoxProps";

// Mocks useRef to simulate drag behavior
const gRefMock = {
  current: document.createElementNS("http://www.w3.org/2000/svg", "g"),
};

jest.mock("../hooks/useRef", () => ({
  useGlobalRefs: () => ({
    gRef: gRefMock,
    isDragging: { current: false },
    start: { current: { x: 0, y: 0 } },
    origin: { current: { x: 100, y: 200 } },
    halfSize: { current: { w: 50, h: 30 } },
  }),
}));

const useDraggableBoxMock = jest.fn();
jest.mock("../hooks/useEffect", () => ({
  useDraggableBox: (props: any) => useDraggableBoxMock(props),
}));

// Sample element and props to test rendering and hooks
const mockElement = {
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

/**
 * Test suite for the <CanvasBox /> component
 */
describe("CanvasBox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Renders an SVG <g> element and ensures it's present in the DOM
   */
  it("renders an SVG <g> element", () => {
    const { container } = render(<CanvasBox {...baseProps} />);
    const g = container.querySelector("g");
    expect(g).toBeInTheDocument();
  });

  /**
   * Verifies that useDraggableBox is called with the correct props
   */
  it("calls useDraggableBox with expected parameters", () => {
    render(<CanvasBox {...baseProps} />);
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
    render(<CanvasBox {...baseProps} />);
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
    render(<CanvasBox {...safeProps} />);
    const lastCall = useDraggableBoxMock.mock.calls[0][0];
    expect(lastCall.openInterface).toBeUndefined();
    expect(lastCall.updatePosition).toBeUndefined();
  });
});
