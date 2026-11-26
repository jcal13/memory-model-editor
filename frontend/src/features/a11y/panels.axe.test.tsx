/**
 * Automated accessibility checks (axe) for the editor's panels and dialogs.
 * axe can't judge colour contrast in jsdom; see contrast.test.ts for that.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import CanvasControls from "../canvasControls/CanvasControls";
import Palette from "../palette/Palette";
import AddObjectPicker, { ADD_CHOICES } from "../canvas/components/AddObjectPicker";
import ModelTextView from "../canvas/components/ModelTextView";
import ConfirmationModal from "../memoryModelEditor/components/ConfirmationModal";
import HelpIcon from "../shared/components/HelpIcon";
import HelpContent from "../tutorial/HelpContent";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { CanvasElement } from "../shared/types";

jest.mock("../palette/hooks/usePalette", () => ({ usePaletteBoxEffect: () => {} }));

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

const elements: CanvasElement[] = [
  {
    boxId: 0, id: "_", x: 0, y: 0,
    kind: { name: "function", type: "function", value: null, functionName: "__main__", params: [{ name: "a", targetId: 1 }] },
  },
  { boxId: 1, id: 1, x: 0, y: 0, kind: { name: "primitive", type: "int", value: "5" } },
];

beforeAll(() => {
  (global as typeof globalThis).ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

describe("axe: panels", () => {
  it.each(["Actions", "View", "Settings"])("Canvas Controls, %s tab", async (tab) => {
    const { container } = render(
      <ThemeProvider>
        <CanvasControls
          onModeToggle={jest.fn()} onClear={jest.fn()} onUndo={jest.fn()} onRedo={jest.fn()}
          onScaleChange={jest.fn()} onEditorScaleChange={jest.fn()} onFontScaleChange={jest.fn()}
          onVisualStyleChange={jest.fn()} onPythonTutorReferenceArrowsChange={jest.fn()}
          onQuestionAtBottomChange={jest.fn()}
          onShowLinkedListViewChange={jest.fn()} onTextViewChange={jest.fn()}
        />
      </ThemeProvider>
    );
    fireEvent.click(screen.getByRole("tab", { name: tab }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Palette (MemoryViz and Python Tutor)", async () => {
    const { container, rerender } = render(
      <ThemeProvider><Palette activeTab="all" setActive={jest.fn()} onAddBox={jest.fn()} /></ThemeProvider>
    );
    expect(await axe(container)).toHaveNoViolations();
    rerender(<ThemeProvider><Palette activeTab="primitives" setActive={jest.fn()} visualStyle="pythonTutor" onAddBox={jest.fn()} /></ThemeProvider>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Add object picker", async () => {
    const { container } = render(<AddObjectPicker choices={ADD_CHOICES} onPick={jest.fn()} onClose={jest.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([false, true])("Text view (visible: %s)", async (visible) => {
    const { container } = render(<ModelTextView elements={elements} visible={visible} onFocusBox={jest.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Help content", async () => {
    const { container } = render(<div role="dialog" aria-label="Help"><HelpContent onStart={jest.fn()} /></div>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("axe: dialogs", () => {
  it("Confirmation dialog", async () => {
    const { container } = render(
      <ConfirmationModal title="Clear Canvas?" message="This clears everything." onConfirm={jest.fn()} onCancel={jest.fn()}
        showCheckbox checkboxLabel="Don't ask again" onCheckboxChange={jest.fn()} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Help popup", async () => {
    render(<HelpIcon title="Grid Layout" text="Lines objects up in a grid." />);
    fireEvent.click(screen.getByRole("button", { name: "Help: Grid Layout" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
