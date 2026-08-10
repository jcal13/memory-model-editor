import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ErrorListDisplay from "./ErrorListDisplay";
import {
  CanvasElement,
  ErrorSource,
  ErrorType,
  ElementError,
} from "../../shared/types";

describe("ErrorListDisplay", () => {
  it("renders reference mismatch feedback and highlights all related elements on hover", () => {
    const error: ElementError = {
      source: ErrorSource.FEEDBACK,
      type: ErrorType.REFERENCE_MISMATCH,
      title: "Reference mismatch",
      message:
        "pair.right should point to the same None object as pair.left",
      relatedElementIds: [10, 20],
      severity: "error",
    };

    const elements: CanvasElement[] = [
      {
        boxId: 1,
        id: 10,
        x: 0,
        y: 0,
        kind: {
          name: "class",
          type: "class",
          value: null,
          className: "Pair",
          classVariables: [],
        },
      },
      {
        boxId: 2,
        id: 20,
        x: 0,
        y: 0,
        kind: {
          name: "primitive",
          type: "NoneType",
          value: "None",
        },
      },
    ];

    const setElements = jest.fn();

    render(
      <ErrorListDisplay
        errors={[
          {
            boxId: 1,
            elementId: 10,
            elementType: "class",
            error,
          },
        ]}
        elements={elements}
        setElements={setElements}
        onOpenEditor={jest.fn()}
      />
    );

    expect(screen.getByText("Reference mismatch")).toBeInTheDocument();
    expect(
      screen.getByText(
        "pair.right should point to the same None object as pair.left"
      )
    ).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByText("Reference mismatch").closest("li")!);

    const hoverUpdater = setElements.mock.calls[0][0];
    expect(hoverUpdater(elements)).toEqual([
      expect.objectContaining({ id: 10, color: "#DC2626" }),
      expect.objectContaining({ id: 20, color: "#DC2626" }),
    ]);

    fireEvent.mouseLeave(screen.getByText("Reference mismatch").closest("li")!);

    const leaveUpdater = setElements.mock.calls[1][0];
    expect(leaveUpdater(elements)).toEqual([
      expect.objectContaining({ id: 10, color: undefined }),
      expect.objectContaining({ id: 20, color: undefined }),
    ]);
  });
});
