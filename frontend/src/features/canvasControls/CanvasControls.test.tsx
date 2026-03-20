import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import CanvasControls from "./CanvasControls";
import { ThemeProvider } from "../../contexts/ThemeContext";

function renderControls(
  overrides: Partial<React.ComponentProps<typeof CanvasControls>> = {}
) {
  return render(
    <ThemeProvider>
      <CanvasControls
        visualStyle="memoryviz"
        onVisualStyleChange={jest.fn()}
        pythonTutorReferenceArrows={false}
        onPythonTutorReferenceArrowsChange={jest.fn()}
        pythonTutorStandalonePrimitives={false}
        onPythonTutorStandalonePrimitivesChange={jest.fn()}
        {...overrides}
      />
    </ThemeProvider>
  );
}

function openSettingsTab() {
  fireEvent.click(screen.getByRole("button", { name: /settings/i }));
}

describe("CanvasControls", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the reference arrows toggle only in Python Tutor mode", () => {
    const { rerender } = renderControls();
    openSettingsTab();

    expect(screen.queryByText("Reference Arrows")).not.toBeInTheDocument();
    expect(screen.queryByText("Standalone Primitives")).not.toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <CanvasControls
          visualStyle="pythonTutor"
          onVisualStyleChange={jest.fn()}
          pythonTutorReferenceArrows={false}
          onPythonTutorReferenceArrowsChange={jest.fn()}
          pythonTutorStandalonePrimitives={false}
          onPythonTutorStandalonePrimitivesChange={jest.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByText("Reference Arrows")).toBeInTheDocument();
    expect(screen.getByText("Standalone Primitives")).toBeInTheDocument();
  });

  it("toggles the standalone primitives switch when enabled in Python Tutor mode", () => {
    const handleStandalonePrimitivesChange = jest.fn();

    renderControls({
      visualStyle: "pythonTutor",
      pythonTutorStandalonePrimitives: false,
      onPythonTutorStandalonePrimitivesChange:
        handleStandalonePrimitivesChange,
    });
    openSettingsTab();

    const controlRow = screen.getByText("Standalone Primitives").closest("div");
    expect(controlRow).not.toBeNull();

    const toggle = within(controlRow as HTMLElement).getByRole("switch");
    fireEvent.click(toggle);

    expect(handleStandalonePrimitivesChange).toHaveBeenCalledWith(true);
  });

  it("toggles the reference arrows switch when enabled in Python Tutor mode", () => {
    const handleReferenceArrowChange = jest.fn();

    renderControls({
      visualStyle: "pythonTutor",
      pythonTutorReferenceArrows: false,
      onPythonTutorReferenceArrowsChange: handleReferenceArrowChange,
    });
    openSettingsTab();

    const controlRow = screen.getByText("Reference Arrows").closest("div");
    expect(controlRow).not.toBeNull();

    const toggle = within(controlRow as HTMLElement).getByRole("switch");
    fireEvent.click(toggle);

    expect(handleReferenceArrowChange).toHaveBeenCalledWith(true);
  });
});
