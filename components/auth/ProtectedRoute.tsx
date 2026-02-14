import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../auth/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { status } = useAuth();
  const { themeId } = useTheme();
  const isClassic = themeId === 'mario';
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className={`rounded-panel border p-8 text-center theme-transition ${isClassic ? 'sc-panel' : 'bg-theme-surface1/70 border-theme-border shadow-card'}`}>
          <p className={`text-[10px] uppercase tracking-[0.28em] mb-2 ${isClassic ? 'text-theme-warning font-black' : 'text-theme-cyan font-black'}`}>
            Authenticating
          </p>
          <p className={isClassic ? 'text-white/85 text-sm' : 'text-theme-muted text-sm'}>
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
