import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Add console error handler to catch any global errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  document.getElementById('root')?.insertAdjacentHTML(
    'afterbegin',
    `<div style="padding: 20px; background-color: #ffebee; color: #c62828; border: 1px solid #ef9a9a; margin: 20px;">
      <h3>JavaScript Error Detected</h3>
      <p>${event.error?.message || 'Unknown error'}</p>
      <pre>${event.error?.stack || 'No stack trace available'}</pre>
    </div>`
  );
});

// Display an initial message to verify rendering starts
const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.innerHTML = '<div style="padding: 20px;">Loading application...</div>';
}

ReactDOM.createRoot(rootElement!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
