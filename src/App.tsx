import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const HubPage = lazy(() => import('./pages/HubPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const SlopcastPage = lazy(() => import('./pages/SlopcastPage'));

const RouteFallback = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 24, height: 24, border: '3px solid rgba(148,163,184,0.3)', borderTopColor: 'rgb(148,163,184)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const App: React.FC = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/slopcast" replace />} />
        <Route
          path="/hub/integrations"
          element={(
            <ProtectedRoute>
              <IntegrationsPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/hub" element={<HubPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/slopcast"
          element={(
            <ProtectedRoute>
              <SlopcastPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/home" element={<Navigate to="/hub" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default App;
