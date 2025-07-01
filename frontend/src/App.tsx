import "./App.css";
import MemoryModelEditor from "./modules/canvasEditor/MemoryModelEditor";

function App() {
  return (
    <div className="App">
      <MemoryModelEditor sandbox={true} />
    </div>
  );
}

export default App;
