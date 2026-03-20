import React from "react";
import { render, screen } from "@testing-library/react";
import Palette from "./Palette";

jest.mock("./components/PaletteBox", () => ({
  __esModule: true,
  default: ({ boxType }: { boxType: string }) => (
    <div data-testid="palette-box">{boxType}</div>
  ),
}));

jest.mock("../canvasControls/CanvasControls", () => ({
  __esModule: true,
  default: () => <div data-testid="canvas-controls" />,
}));

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

describe("Palette Python Tutor primitive mode", () => {
  beforeAll(() => {
    (global as typeof globalThis).ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  it("hides primitive palette boxes in inline mode and shows them in standalone mode", () => {
    const { rerender } = render(
      <Palette
        activeTab="primitives"
        setActive={jest.fn()}
        visualStyle="pythonTutor"
        pythonTutorStandalonePrimitives={false}
      />
    );

    expect(screen.queryAllByTestId("palette-box")).toHaveLength(0);
    expect(
      screen.getByText("Primitive values are created inline in Python Tutor mode.")
    ).toBeInTheDocument();

    rerender(
      <Palette
        activeTab="primitives"
        setActive={jest.fn()}
        visualStyle="pythonTutor"
        pythonTutorStandalonePrimitives={true}
      />
    );

    expect(screen.queryByText(/created inline/i)).toBeNull();
    expect(screen.getAllByTestId("palette-box")).toHaveLength(5);
  });
});
