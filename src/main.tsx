import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { initializeIcons } from '@fluentui/font-icons-mdl2';
import App from './App';
import './index.css';

// Register Fluent icon font
initializeIcons();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Root element with id 'root' not found. Ensure your HTML file has a <div id='root'></div>.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
