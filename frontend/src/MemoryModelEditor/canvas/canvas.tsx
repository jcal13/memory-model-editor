import React, { useState, useRef } from "react";
import Draggable from "react-draggable";
import { CanvasElement, ElementKind } from "../types";

import PrimitiveBoxCanvas from "./boxCanvasDisplays/primitveBoxCanvas";
import FunctionBoxCanvas from "./boxCanvasDisplays/functionBoxCanvas";
import ListBoxCanvas from "./boxCanvasDisplays/listBoxCanvas";
import SetBoxCanvas from "./boxCanvasDisplays/setBoxCanvas";
import DictBoxCanvas from "./boxCanvasDisplays/dictBoxCanvas";
import TupleBoxCanvas from "./boxCanvasDisplays/tupleBoxCanvas";

import PrimitiveEditor from "./boxEditorDisplays/primitiveEditor";
import FunctionEditor from "./boxEditorDisplays/functionEditor";
import ListEditor from "./boxEditorDisplays/listEditor";
import SetEditor from "./boxEditorDisplays/setEditor";
import DictEditor from "./boxEditorDisplays/dictEditor";
import TupleEditor from "./boxEditorDisplays/tupleEditor";

const editorMap: Record<ElementKind["name"], React.FC<any>> = {
  primitive: PrimitiveEditor,
  function: FunctionEditor,
  list: ListEditor,
  tuple: TupleEditor,
  set: SetEditor,
  dict: DictEditor,
};

interface Props {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
}

export default function Canvas({ elements, setElements }: Props) {
  const [selected, setSelected] = useState<CanvasElement | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const payload = e.dataTransfer.getData("application/box-type");
    let newKind: ElementKind;

    switch (payload) {
      case "primitive":
        newKind = { name: "primitive", type: "int", value: "0" };
        break;
      case "function":
        newKind = {
          name: "function",
          type: "function",
          value: null,
          functionName: "myFunction",
          params: [],
        };
        break;
      case "list":
        newKind = { name: "list", type: "list", value: [] };
        break;
      case "tuple":
        newKind = { name: "tuple", type: "tuple", value: [] };
        break;
      case "set":
        newKind = { name: "set", type: "set", value: [] };
        break;
      case "dict":
        newKind = { name: "dict", type: "dict", value: {} };
        break;
      default:
        return;
    }

    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    setElements((prev) => [...prev, { id: prev.length, kind: newKind, x, y }]);
  };

  const saveElement = (updatedKind: ElementKind) => {
    console.log(updatedKind)
    if (!selected) return;
    setElements((prev) =>
      prev.map((el) =>
        el.id === selected.id ? { ...el, kind: updatedKind } : el
      )
    );
    setSelected(null);
  };

  const removeElement = () => {
    if (!selected) return;
    setElements((prev) => prev.filter((el) => el.id !== selected.id));
    setSelected(null);
  };

  return (
    <>
      <svg
        width={800}
        height={600}
        style={{ border: "1px solid #000" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {elements.map((el) => {
          switch (el.kind.name) {
            case "primitive":
              return (
                <PrimitiveBoxCanvas
                  key={el.id}
                  element={el}
                  openPrimitiveInterface={() => setSelected(el)}
                />
              );
            case "function":
              return (
                <FunctionBoxCanvas
                  key={el.id}
                  element={el}
                  openFunctionInterface={() => setSelected(el)}
                />
              );
            case "list":
              return (
                <ListBoxCanvas
                  key={el.id}
                  element={el}
                  openListInterface={() => setSelected(el)}
                />
              );
            case "tuple":
              return (
                <TupleBoxCanvas
                  key={el.id}
                  element={el}
                  openListInterface={() => setSelected(el)}
                />
              );
            case "set":
              return (
                <SetBoxCanvas
                  key={el.id}
                  element={el}
                  openSetInterface={() => setSelected(el)}
                />
              );
            case "dict":
              return (
                <DictBoxCanvas
                  key={el.id}
                  element={el}
                  openDictInterface={() => setSelected(el)}
                />
              );
            default:
              return null;
          }
        })}
      </svg>

      {selected && (
        <Draggable
          nodeRef={dragRef as React.RefObject<HTMLElement>}
          handle=".drag-handle"
          defaultPosition={{ x: 400, y: 80 }}
        >
          <div
            ref={dragRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              backgroundColor: "white",
            }}
          >
            {(() => {
              const Editor = editorMap[selected.kind.name];
              return (
                <Editor
                  element={selected}
                  onSave={saveElement}
                  onCancel={() => setSelected(null)}
                  onRemove={removeElement}
                />
              );
            })()}
          </div>
        </Draggable>
      )}
    </>
  );
}
