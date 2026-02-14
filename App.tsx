import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import HubPage from './pages/HubPage';
import NotFoundPage from './pages/NotFoundPage';
import SlopcastPage from './pages/SlopcastPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HubPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/slopcast"
        element={(
          <ProtectedRoute>
            <SlopcastPage />
          </ProtectedRoute>
        )}
      />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
