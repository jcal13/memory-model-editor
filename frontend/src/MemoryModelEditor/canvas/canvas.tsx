import React, { useState, useRef, useEffect } from "react";
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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewBox, setViewBox] = useState<string>("0 0 0 0");

  // Initialize viewBox on mount based on the SVG's rendered size
  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      const { width, height } = svg.getBoundingClientRect();
      setViewBox(`0 0 ${width} ${height}`);
    }
  }, []);

  // Centralized position updater
  const makePositionUpdater = (id: number) => (x: number, y: number) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, x, y } : el))
    );
  };

  const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const payload = e.dataTransfer.getData("application/box-type");
    let newKind: ElementKind;

    switch (payload) {
      case "primitive":
        newKind = { name: "primitive", type: "int", value: "0" };
        break;
      case "function":
        newKind = { name: "function", type: "function", value: null, functionName: "myFunction", params: [] };
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

    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const coords = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    setElements(prev => [
      ...prev,
      { id: prev.length, kind: newKind, x: coords.x, y: coords.y }
    ]);
  };

  const saveElement = (updatedKind: ElementKind) => {
    if (!selected) return;
    setElements(prev =>
      prev.map(el =>
        el.id === selected.id ? { ...el, kind: updatedKind } : el
      )
    );
    setSelected(null);
  };

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={viewBox}
        preserveAspectRatio="xMinYMin meet"
        style={{ border: "1px solid #000", width: "100%", height: "100%" }}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        <g>
          {elements.map(el => {
            const updater = makePositionUpdater(el.id);
            switch (el.kind.name) {
              case "primitive":
                return (
                  <PrimitiveBoxCanvas
                    key={el.id}
                    element={el}
                    openPrimitiveInterface={() => setSelected(el)}
                    updatePosition={updater}
                  />
                );
              case "function":
                return (
                  <FunctionBoxCanvas
                    key={el.id}
                    element={el}
                    openFunctionInterface={() => setSelected(el)}
                    updatePosition={updater}
                  />
                );
              case "list":
                return (
                  <ListBoxCanvas
                    key={el.id}
                    element={el}
                    openListInterface={() => setSelected(el)}
                    updatePosition={updater}
                  />
                );
              case "tuple":
                return (
                  <TupleBoxCanvas
                    key={el.id}
                    element={el}
                    openListInterface={() => setSelected(el)}
                    updatePosition={updater}
                  />
                );
              case "set":
                return (
                  <SetBoxCanvas
                    key={el.id}
                    element={el}
                    openSetInterface={() => setSelected(el)}
                    updatePosition={updater}
                  />
                );
              case "dict":
                return (
                  <DictBoxCanvas
                    key={el.id}
                    element={el}
                    openDictInterface={() => setSelected(el)}
                    updatePosition={updater}
                  />
                );
              default:
                return null;
            }
          })}
        </g>
      </svg>

      {selected && (() => {
        const Editor = editorMap[selected.kind.name];
        return (
          <Editor
            element={selected}
            onSave={saveElement}
            onCancel={() => setSelected(null)}
          />
        );
      })()}
    </>
  );
}
