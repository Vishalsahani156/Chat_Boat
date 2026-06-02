import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';

/** Hide React's dev-only DevTools advertisement in the browser console */
if (import.meta.env.DEV) {
  const orig = console.info.bind(console);
  console.info = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Download the React DevTools'))
      return;
    orig(...args);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
