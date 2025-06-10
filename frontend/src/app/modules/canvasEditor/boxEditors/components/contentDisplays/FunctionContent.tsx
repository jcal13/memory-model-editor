import { pillBase, closeButton } from "../../styles/boxEditorStyles";

interface Props {
  functionParams: any;
  setParams: any;
}

const FunctionContent = ({ functionParams, setParams }: Props) => {
  const addParam = () =>
    setParams([...functionParams, { name: "", targetId: null }]);
  const removeParam = (i: number) =>
    setParams(functionParams.filter((_: any, idx: any) => idx !== i));
  const changeName = (i: number, val: string) =>
    setParams(
      functionParams.map((p: any, idx: any) =>
        idx === i ? { ...p, name: val } : p
      )
    );
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: "0 24px",
        }}
      >
        {functionParams.map((p: any, idx: any) => (
          <div
            key={idx}
            style={{ display: "flex", alignItems: "center", gap: 24 }}
          >
            <input
              style={{
                ...pillBase,
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
                style={closeButton}
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
    </>
  );
};

export default FunctionContent;
