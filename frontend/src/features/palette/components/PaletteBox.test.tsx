import React from "react";
import { render, fireEvent } from "@testing-library/react";
import PaletteBox from "./PaletteBox";

// Mocks BoxConfigs to bypass actual rendering logic
jest.mock("../utils/BoxConfigs", () => ({
  BoxConfigs: {
    primitive: {},
    list: {},
    dict: {},
  },
}));

// Mocks the hook responsible for rendering side effects
jest.mock("../hooks/useEffect", () => ({
  usePaletteBoxEffect: jest.fn(),
}));

/**
 * Test suite for the <PaletteBox /> component
 */
describe("PaletteBox", () => {
  /**
   * Renders without crashing for a valid boxType and applies correct attributes
   */
  it("renders without crashing for valid boxType", () => {
    const { container } = render(<PaletteBox boxType="primitive" />);
    const div = container.querySelector("div");
    expect(div).toBeInTheDocument();
    expect(div).toHaveAttribute("draggable", "true");
  });

  /**
   * Fires dragStart and sets correct metadata on dataTransfer
   */
  it("calls dataTransfer.setData on dragStart", () => {
    const setData = jest.fn();

    const mockEvent = {
      dataTransfer: {
        setData,
        effectAllowed: "",
      },
    } as unknown as React.DragEvent<HTMLDivElement>;

    const { container } = render(<PaletteBox boxType="list" />);
    const draggable = container.querySelector("div") as HTMLDivElement;

    fireEvent.dragStart(draggable, mockEvent);

    expect(setData).toHaveBeenCalledWith("application/box-type", "list");
    expect(mockEvent.dataTransfer.effectAllowed).toBe("move");
  });

  /**
   * Applies consistent inline styling for layout and interaction
   */
  it("has correct inline styles", () => {
    const { container } = render(<PaletteBox boxType="dict" />);
    const box = container.querySelector("div") as HTMLDivElement;
    const style = window.getComputedStyle(box);

    expect(style.cursor).toBe("grab");
    expect(style.overflow).toBe("visible");
    expect(style.display).toBe("inline-block");
  });
});
