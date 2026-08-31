import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/index.css';
import { registerServiceWorker } from './pwa/registerServiceWorker';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to locate root HTML mount element.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register production Service Worker
registerServiceWorker();
