import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useSelector((s: RootState) => s.auth);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
