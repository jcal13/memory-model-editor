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

function openViewTab() {
  fireEvent.click(screen.getByRole("button", { name: /^view$/i }));
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

describe("CanvasControls help icons", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows a help icon for the panel title explaining the tabs", () => {
    renderControls();

    fireEvent.click(
      screen.getByRole("button", { name: "Help: Canvas Controls" })
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Actions to undo/i)).toBeInTheDocument();
  });

  it("shows help icons for Clear and Download without triggering their actions", () => {
    const handleClear = jest.fn();
    renderControls({ onClear: handleClear, elements: [] });

    fireEvent.click(screen.getByRole("button", { name: "Help: Clear" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(handleClear).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Help: Download" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows help icons for all three zoom controls in the View tab", () => {
    renderControls({
      onScaleChange: jest.fn(),
      onEditorScaleChange: jest.fn(),
      onFontScaleChange: jest.fn(),
    });
    openViewTab();

    expect(
      screen.getByRole("button", { name: "Help: Canvas Zoom" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Help: Editor Zoom" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Help: Question Zoom" })
    ).toBeInTheDocument();
  });

  it("shows a help icon for the practice/test mode toggle without flipping it", () => {
    const handleModeToggle = jest.fn();
    renderControls({ onModeToggle: handleModeToggle, isSandboxMode: true });
    openSettingsTab();

    fireEvent.click(
      screen.getByRole("button", { name: "Help: Practice / Test Mode" })
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(handleModeToggle).not.toHaveBeenCalled();
  });

  it("shows a help icon for the Python Tutor Style toggle", () => {
    renderControls();
    openSettingsTab();

    fireEvent.click(
      screen.getByRole("button", { name: "Help: Python Tutor Style" })
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/look like PythonTutor's visualizer/i)
    ).toBeInTheDocument();
  });

  it("shows help icons for Standalone Primitives and Reference Arrows in Python Tutor mode", () => {
    renderControls({ visualStyle: "pythonTutor" });
    openSettingsTab();

    expect(
      screen.getByRole("button", { name: "Help: Standalone Primitives" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Help: Reference Arrows" })
    ).toBeInTheDocument();
  });

  it("shows a help icon for Dark Mode without flipping the toggle", () => {
    renderControls();
    openSettingsTab();

    const darkModeSwitch = screen.getByRole("switch", { name: /dark mode/i });
    expect(darkModeSwitch).toHaveAttribute("aria-checked", "false");

    fireEvent.click(screen.getByRole("button", { name: "Help: Dark Mode" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/exported on a white background/i)
    ).toBeInTheDocument();
    expect(darkModeSwitch).toHaveAttribute("aria-checked", "false");
  });
});
