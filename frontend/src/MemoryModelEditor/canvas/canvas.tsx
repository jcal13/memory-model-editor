import React, { useState } from "react";
import { CanvasElement, ElementKind } from "../types";
import PrimitiveBoxCanvas from "./boxCanvasDisplays/primitveBoxCanvas";
import FunctionBoxCanvas from "./boxCanvasDisplays/functionBoxCanvas"; // new
import ListBoxCanvas from "./boxCanvasDisplays/listBoxCanvas";
import SetBoxCanvas from "./boxCanvasDisplays/setBoxCanvas";
import DictBoxCanvas from "./boxCanvasDisplays/dictBoxCanvas";
import PrimitiveEditor from "./boxEditorDisplays/primitiveEditor";
import FunctionEditor from "./boxEditorDisplays/functionEditor"; // new
import TupleBoxCanvas from "./boxCanvasDisplays/tupleBoxCanvas";

const editorMap: Record<string, React.FC<any>> = {
  primitive: PrimitiveEditor,
  function: FunctionEditor, 
  list: FunctionEditor,
  set: FunctionEditor,
  dict: FunctionEditor,
};

interface Props {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
}

export default function Canvas({ elements, setElements }: Props) {
  const [selected, setSelected] = useState<CanvasElement | null>(null);

  const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();

    const payload = e.dataTransfer.getData("application/box-type");
    let newKind: ElementKind;

    if (payload === "primitive") {
      newKind = {
        name: "primitive",
        type: "int",
        value: "null",
      };
    } else if (payload === "function") {
      newKind = {
        name: "function",
        type: "int",
        value: "null",
      };
    } else if (payload === "list") {
      newKind = {
        name: "list",
        type: "int",
        value: "null",
      } 
    } else if (payload === "tuple") {
        newKind = {
          name: "tuple",
          type: "int",
          value: "null",
          items: [],
      }
    } else if (payload === "set") {
      newKind = {
        name: "set",
        type: "int",
        value: "null",
      };
    } else if (payload === "dict") {
      newKind = {
        name: "dict",
        type: "int",
        value: "null",
        keyType: "int",
        keyValue: "null",
      };
    } else {
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
    if (!selected) return;
    setElements((prev) =>
      prev.map((el) =>
        el.id === selected.id ? { ...el, kind: updatedKind } : el
      )
    );
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

      {selected &&
        (() => {
          const Edit = editorMap[selected.kind.name];
          return (
            <Edit
              element={selected}
              onSave={saveElement}
              onCancel={() => setSelected(null)}
            />
          );
        })()}
    </>
  );
}
