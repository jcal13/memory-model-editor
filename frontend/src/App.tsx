import "./App.css";
import "./styles/theme.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import MemoryModelEditor from "./features/memoryModelEditor/MemoryModelEditor";

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <MemoryModelEditor sandbox={true} />
      </div>
    </ThemeProvider>
  );
}

export default App;
