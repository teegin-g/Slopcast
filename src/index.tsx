import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import './app.css';
import './styles/theme.css';

const DebugProvider = import.meta.env.DEV
  ? lazy(() => import('./components/debug/DebugProvider').then(m => ({ default: m.DebugProvider })))
  : null;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
          {DebugProvider && (
            <Suspense fallback={null}>
              <DebugProvider />
            </Suspense>
          )}
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
