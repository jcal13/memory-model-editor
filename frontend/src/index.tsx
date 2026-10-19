import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { getBrowserZoom } from './features/shared/uiScale';
import { RESIZE_HANDLE_SIZE } from './features/memoryModelEditor/utils/panelSizing';

// CSS and pointer calculations use the same divider size.
document.documentElement.style.setProperty('--resize-handle-width', `${RESIZE_HANDLE_SIZE}px`);

// Apply before mounting so canvas measurements and portal geometry agree.
const updateWorkspaceScale = () => {
  const state = getBrowserZoom();
  document.documentElement.style.setProperty('--ui-scale', String(state.appliedZoom));
};
let resolutionQuery: MediaQueryList | undefined;
const watchResolution = () => {
  resolutionQuery?.removeEventListener('change', onResolutionChange);
  resolutionQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  resolutionQuery.addEventListener('change', onResolutionChange);
};
function onResolutionChange() {
  updateWorkspaceScale();
  watchResolution();
}
updateWorkspaceScale();
watchResolution();
window.addEventListener('resize', updateWorkspaceScale);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
