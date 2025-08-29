import "./App.css";
import MemoryModelEditor from "./features/memoryModelEditor/MemoryModelEditor";

function App() {
  return (
    <div className="App">
      <MemoryModelEditor sandbox={true} />
    </div>
  );
}

export default App;
