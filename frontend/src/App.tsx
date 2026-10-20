import { useEffect, useState } from "react";
import "./App.css";
import "./styles/theme.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import MemoryModelEditor from "./features/memoryModelEditor/MemoryModelEditor";

// Show the recommendation only when portrait orientation restricts workspace.
const NARROW_WINDOW_QUERY = "(max-width: 600px) and (orientation: portrait)";

function App() {
  const [isNarrowWindow, setIsNarrowWindow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(NARROW_WINDOW_QUERY);
    const update = () => setIsNarrowWindow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const [narrowNoticeDismissed, setNarrowNoticeDismissed] = useState(false);
  return (
    <ThemeProvider>
      <div className="App">
        <MemoryModelEditor sandbox={true} />
        {isNarrowWindow && !narrowNoticeDismissed && (
          <aside className="narrow-window-notice" aria-label="Window size recommendation">
            <svg className="narrow-window-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M10.3 4.5a2 2 0 0 1 3.4 0l7.5 13a2 2 0 0 1-1.7 3H4.5a2 2 0 0 1-1.7-3z" />
              <path d="M12 9v5m0 3v.5" strokeLinecap="round" />
            </svg>
            <p>
              <strong>A wider window works best</strong>
              Rotate to landscape or use a laptop for more workspace.
            </p>
            <button
              type="button"
              aria-label="Dismiss window size recommendation"
              onClick={() => setNarrowNoticeDismissed(true)}
            >
              ×
            </button>
          </aside>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
