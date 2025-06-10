import { PrimitiveType } from "../../../shared/types";

interface Props {
  dataType: PrimitiveType;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
}

const PrimitiveContent = ({ dataType, value, setValue }: Props) => {
  const int = (v: string) => /^-?\d+$/.test(v);
  const float = (v: string) => /^-?\d+(\.\d+)?$/.test(v);
  const bool = (v: string) => v === "true" || v === "false";

  const isValid = () =>
    dataType === "int"
      ? int(value)
      : dataType === "float"
      ? float(value)
      : dataType === "bool"
      ? bool(value)
      : true;

  return (
    <div style={{ padding: "0 24px", textAlign: "center" }}>
      {dataType === "bool" ? (
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          {["true", "false"].map((opt) => (
            <label key={opt} style={{ fontSize: "1rem" }}>
              <input
                type="radio"
                checked={value === opt}
                onChange={() => setValue(opt)}
                style={{ marginRight: 6 }}
              />
              {opt}
            </label>
          ))}
        </div>
      ) : dataType === "None" ? (
        <div style={{ fontSize: "1rem", color: "#666" }}>None</div>
      ) : (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="value"
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 4,
            border: "1px solid #ccc",
            boxSizing: "border-box",
            fontSize: "1rem",
          }}
        />
      )}

      {!isValid() && (
        <div
          style={{
            color: "red",
            fontSize: "0.85rem",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Invalid&nbsp;{dataType}&nbsp;value
        </div>
      )}
    </div>
  );
};

export default PrimitiveContent;
