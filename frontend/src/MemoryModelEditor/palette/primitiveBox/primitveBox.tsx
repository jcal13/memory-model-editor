export default function PrimitiveBox() {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/box-type", "primitive");
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        width: 80,
        height: 40,
        border: "2px solid #333",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "grab",
      }}
    >
      <div style={{ width: 60, height: 24, border: "1px solid #333" }}>
        Primitive
      </div>
    </div>
  );
}
