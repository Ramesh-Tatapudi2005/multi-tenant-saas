import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="container mt-5 text-center"><p>Loading...</p></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
