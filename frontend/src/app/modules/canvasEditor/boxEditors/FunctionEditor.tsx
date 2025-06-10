import { useEffect, useRef, useState } from "react";

type Param = { name: string; targetId: number | null };
interface Kind {
  name: "function";
  type: "function";
  value: null;
  functionName: string;
  params: Param[];
}
interface Props {
  element: { id: string; kind: Kind };
  onSave: (kind: Kind) => void;
  onCancel: () => void;
  onRemove: () => void;
}

export default function FunctionEditor({
  element,
  onSave,
  onCancel,
  onRemove,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [funcName, setName] = useState(element.kind.functionName || "");
  const [params, setParams] = useState<Param[]>(element.kind.params || []);
  const [hoverRemove, setHoverRemove] = useState(false);

  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [onSave, onCancel]);

  const addParam = () => setParams([...params, { name: "", targetId: null }]);
  const removeParam = (i: number) =>
    setParams(params.filter((_, idx) => idx !== i));
  const changeName = (i: number, val: string) =>
    setParams(params.map((p, idx) => (idx === i ? { ...p, name: val } : p)));

  const handleSave = () =>
    onSave({
      name: "function",
      type: "function",
      value: null,
      functionName: funcName,
      params,
    });

  const pillBase = {
    background: "#f5f5f5",
    border: "1px solid #888",
    borderRadius: 4,
  } as const;
  const closeBtn = {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    background: "#f44336",
    border: "none",
    borderRadius: 4,
    color: "#fff",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "background-color 0.25s ease",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  } as const;

  return (
    <div
      ref={wrapRef}
      className="drag-handle"
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        width: "max-content",
        minWidth: 320,
        background: "#fff",
        border: "1px solid #888",
        borderRadius: 6,
        boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        paddingBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: 10,
          borderBottom: "1px solid #ddd",
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
        }}
      >
        <input
          style={{
            ...pillBase,
            width: 160,
            height: 40,
            padding: "0 10px",
            fontSize: "0.9rem",
          }}
          placeholder="function name"
          value={funcName}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* next two are content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: "0 24px",
        }}
      >
        {params.map((p, idx) => (
          <div
            key={idx}
            style={{ display: "flex", alignItems: "center", gap: 24 }}
          >
            <input
              style={{
                ...pillBase,
                width: 100,
                height: 50,
                padding: "0 10px",
                fontSize: "0.9rem",
              }}
              placeholder="var"
              value={p.name}
              onChange={(e) => changeName(idx, e.target.value)}
            />
            <span style={{ fontSize: "2rem" }}>=</span>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  ...pillBase,
                  width: 80,
                  height: 50,
                  fontSize: "1.6rem",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                +
              </div>
              <button
                onClick={() => removeParam(idx)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#d32f2f")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f44336")
                }
                style={closeBtn}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={addParam}
          style={{
            ...pillBase,
            padding: "10px 26px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          + Add Variable
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          paddingRight: 24,
        }}
      >
        <button
          onMouseEnter={() => setHoverRemove(true)}
          onMouseLeave={() => setHoverRemove(false)}
          onClick={() => {
            handleSave();
            onRemove();
          }}
          style={{
            background: hoverRemove ? "#d32f2f" : "#f44336",
            color: "#fff",
            border: "none",
            padding: "4px 6px",
            fontSize: "0.8rem",
            borderRadius: 4,
            cursor: "pointer",
            transition: "background-color 0.25s ease",
          }}
        >
          Remove Box
        </button>
      </div>
    </div>
  );
}
