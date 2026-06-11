import React from "react";
import { render, screen } from "@testing-library/react";
import FunctionContent from "./functionBoxes/FunctionContent";
import ClassContent from "./classBoxes/ClassContent";
import CollectionItem from "./collectionBoxes/CollectionItem";
import { CanvasElement } from "../../shared/types";

jest.mock("../idEditor/IdEditor", () => ({
  __esModule: true,
  default: ({ currentId }: { currentId: number | string | null }) => (
    <div data-testid="id-selector">{String(currentId)}</div>
  ),
}));

jest.mock("./InlineTargetEditor", () => ({
  __esModule: true,
  default: () => <div data-testid="inline-target-editor" />,
}));

const baseOwnerElement: CanvasElement = {
  boxId: 1,
  id: "_",
  x: 0,
  y: 0,
  kind: {
    name: "function",
    type: "function",
    value: null,
    functionName: "__main__",
    params: [],
  },
};

describe("Python Tutor standalone primitives editor mode", () => {
  it("uses the inline target editor for function params in inline mode", () => {
    render(
      <FunctionContent
        functionParams={[{ name: "x", targetId: 1 }]}
        setParams={jest.fn()}
        functionName="demo"
        ids={[1]}
        addId={jest.fn()}
        removeId={jest.fn()}
        sandbox={true}
        elements={[]}
        ownerElement={baseOwnerElement}
        visualStyle="pythonTutor"
        pythonTutorStandalonePrimitives={false}
      />
    );

    expect(screen.getByTestId("inline-target-editor")).toBeInTheDocument();
    expect(screen.queryByTestId("id-selector")).toBeNull();
  });

  it("uses the normal ID selector for class variables in standalone mode", () => {
    render(
      <ClassContent
        classVariables={[{ name: "value", targetId: 2 }]}
        setVariables={jest.fn()}
        className="Node"
        ids={[2]}
        addId={jest.fn()}
        removeId={jest.fn()}
        sandbox={true}
        elements={[]}
        ownerElement={{
          ...baseOwnerElement,
          kind: {
            name: "class",
            type: "class",
            value: null,
            className: "Node",
            classVariables: [],
          },
        }}
        visualStyle="pythonTutor"
        pythonTutorStandalonePrimitives={true}
      />
    );

    expect(screen.getByTestId("id-selector")).toBeInTheDocument();
    expect(screen.queryByTestId("inline-target-editor")).toBeNull();
  });

  it("uses the normal ID selector for collection items in standalone mode", () => {
    render(
      <CollectionItem
        mode="single"
        items={[3]}
        setItems={jest.fn()}
        ids={[3]}
        addId={jest.fn()}
        removeId={jest.fn()}
        sandbox={true}
        elements={[]}
        ownerElement={{
          ...baseOwnerElement,
          id: 4,
          kind: {
            name: "list",
            type: "list",
            value: [],
          },
        }}
        visualStyle="pythonTutor"
        pythonTutorStandalonePrimitives={true}
      />
    );

    expect(screen.getByTestId("id-selector")).toBeInTheDocument();
    expect(screen.queryByTestId("inline-target-editor")).toBeNull();
  });

  it("keeps the inline target editor for collection items in inline mode", () => {
    render(
      <CollectionItem
        mode="single"
        items={[3]}
        setItems={jest.fn()}
        ids={[3]}
        addId={jest.fn()}
        removeId={jest.fn()}
        sandbox={true}
        elements={[]}
        ownerElement={{
          ...baseOwnerElement,
          id: 4,
          kind: {
            name: "list",
            type: "list",
            value: [],
          },
        }}
        visualStyle="pythonTutor"
        pythonTutorStandalonePrimitives={false}
      />
    );

    expect(screen.getByTestId("inline-target-editor")).toBeInTheDocument();
    expect(screen.queryByTestId("id-selector")).toBeNull();
  });
});
