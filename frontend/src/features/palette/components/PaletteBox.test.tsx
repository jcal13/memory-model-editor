import { fireEvent, render, screen } from "@testing-library/react";
import PaletteBox from "./PaletteBox";

jest.mock("../hooks/usePalette", () => ({ usePaletteBoxEffect: () => {} }));

describe("PaletteBox keyboard", () => {
  it("adds the box on Enter or Space", () => {
    const onActivate = jest.fn();
    render(<PaletteBox boxType="list" visualStyle="memoryviz" onActivate={onActivate} />);
    const box = screen.getByRole("button", { name: /Add list box/ });
    fireEvent.keyDown(box, { key: "Enter" });
    fireEvent.keyDown(box, { key: " " });
    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(onActivate).toHaveBeenCalledWith("list");
  });

  it("ignores other keys and shortcuts, and stays drag-only without a handler", () => {
    const onActivate = jest.fn();
    const { rerender } = render(<PaletteBox boxType="function" visualStyle="memoryviz" onActivate={onActivate} />);
    const box = screen.getByRole("button", { name: /Add frame box/ });
    fireEvent.keyDown(box, { key: "a" });
    fireEvent.keyDown(box, { key: "Enter", metaKey: true });
    expect(onActivate).not.toHaveBeenCalled();
    rerender(<PaletteBox boxType="function" visualStyle="memoryviz" />);
    expect(screen.getByRole("button", { name: "Draggable frame box" })).toBeInTheDocument();
  });
});
