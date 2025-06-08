import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { CanvasElement, ElementKind } from "../shared/types";
import CanvasBox from "./CanvasBox";

import PrimitiveEditor from "../boxEditors/PrimitiveEditor";
import FunctionEditor from "../boxEditors/FunctionEditor";
import ListEditor from "../boxEditors/ListEditor";
import SetEditor from "../boxEditors/SetEditor";
import DictEditor from "../boxEditors/DictEditor";
import TupleEditor from "../boxEditors/TupleEditor";

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

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const recalc = () => {
      const { width, height } = svg.getBoundingClientRect();
      setViewBox(`0 0 ${width} ${height}`);
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  const makePositionUpdater = (id: number) => (x: number, y: number) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, x, y } : el))
    );
  };

  const dragRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const payload = e.dataTransfer.getData("application/box-type");
    let newKind: ElementKind;

    switch (payload) {
      case "primitive":
        newKind = { name: "primitive", type: "None", value: "None" };
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

    const pt = svgRef.current!.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const coords = pt.matrixTransform(svgRef.current!.getScreenCTM()!.inverse());

    setElements(prev => [
      ...prev,
      { id: prev.length, kind: newKind, x: coords.x, y: coords.y },
    ]);
  };

  const saveElement = (updatedKind: ElementKind) => {
    if (!selected) return;
    setElements(prev =>
      prev.map(el => (el.id === selected.id ? { ...el, kind: updatedKind } : el))
    );
    setSelected(null);
  };

  const removeElement = () => {
    if (!selected) return;
    setElements(prev => prev.filter(el => el.id !== selected.id));
    setSelected(null);
  };

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={viewBox}
        preserveAspectRatio="xMinYMin meet"
        style={{ border: "1px solid #000", width: "100%", height: "99%" }}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        <g>
          {elements.map(el => (
            <CanvasBox
              key={el.id}
              element={el}
              openInterface={() => setSelected(el)}
              updatePosition={makePositionUpdater(Number(el.id))}
            />
          ))}
        </g>
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
