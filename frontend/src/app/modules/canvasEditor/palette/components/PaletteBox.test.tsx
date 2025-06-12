import React from "react";
import { render, fireEvent } from "@testing-library/react";
import PaletteBox from "./PaletteBox";

// ===== Mock Dependencies =====

// Mock the BoxConfigs module to provide just enough structure for rendering
jest.mock("../utils/BoxConfigs", () => ({
  BoxConfigs: {
    primitive: {},
    list: {},
    dict: {},
  },
}));

// Mock the custom hook to avoid invoking real SVG rendering logic
jest.mock("../hooks/useEffect", () => ({
  usePaletteBoxEffect: jest.fn(),
}));

// ===== Test Suite: PaletteBox Component =====

describe("PaletteBox", () => {
  /**
   * Test that the PaletteBox component renders successfully
   * with a valid boxType and contains a draggable <div>.
   */
  it("renders without crashing for valid boxType", () => {
    const { container } = render(<PaletteBox boxType="primitive" />);
    const div = container.querySelector("div");
    expect(div).toBeInTheDocument();
    expect(div).toHaveAttribute("draggable", "true");
  });

  /**
   * Test that the correct drag-and-drop metadata is set
   * when the user starts dragging the PaletteBox.
   */
  it("calls dataTransfer.setData on dragStart", () => {
    const setData = jest.fn();

    // Create a mock DragEvent object with a mock dataTransfer API
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
   * Test that the inline style applied to the draggable container
   * matches the expected values (used for consistent UI layout).
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
