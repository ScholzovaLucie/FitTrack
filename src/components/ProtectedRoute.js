import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // Pokud není uživatel přihlášen, přesměruj ho na login stránku
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Pokud je uživatel přihlášen, zobrazíme obsah (children)
  return children;
};

export default ProtectedRoute;
