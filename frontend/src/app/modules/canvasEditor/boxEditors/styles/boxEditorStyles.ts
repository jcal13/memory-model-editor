// styles ID and type selectors
export const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 12px",
  fontSize: "0.9rem",
  background: "#f5f5f5",
  border: "1px solid #888",
  borderRadius: 4,
  whiteSpace: "nowrap",
  lineHeight: 1.2,
};

export const pillBase: React.CSSProperties = {
  background: "#f5f5f5",
  border: "1px solid #888",
  borderRadius: 4,
  width: 100,
  height: 50,
  padding: "0 10px",
  fontSize: "0.9rem",
};

export const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 10,
  borderTopLeftRadius: 6,
  borderTopRightRadius: 6,
};

export const module: React.CSSProperties = {
  position: "absolute",
  top: 20,
  right: 20,
  width: 320,
  height: 320,
  background: "#fff",
  border: "1px solid #888",
  borderRadius: 6,
  boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

export const closeButton: React.CSSProperties = {
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
};
