import "./App.css";
import "./styles/theme.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import MemoryModelEditor from "./features/memoryModelEditor/MemoryModelEditor";

import DeviceGuidance from "./features/deviceGuidance/DeviceGuidance";

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <MemoryModelEditor sandbox={true} />
        <DeviceGuidance />
      </div>
    </ThemeProvider>
  );
}

export default App;
