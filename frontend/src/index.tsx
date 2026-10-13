import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { workspaceScale } from './features/shared/uiScale';

// Apply before mounting so canvas measurements and popup geometry agree.
const updateWorkspaceScale = () => {
  document.documentElement.style.setProperty(
    '--ui-scale', String(workspaceScale(window.innerWidth, window.innerHeight))
  );
};
updateWorkspaceScale();
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
