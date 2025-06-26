import axios from "axios";
import "./App.css";
import MemoryModelEditor from "./app/modules/canvasEditor/MemoryModelEditor";

function App() {
  return (
    <div className="App">
      <MemoryModelEditor sandbox={false}/>
    </div>
  );
}

export default App;
