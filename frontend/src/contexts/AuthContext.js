import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data.data);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password, tenantSubdomain) => {
    const response = await authAPI.login({
      email,
      password,
      tenantSubdomain: tenantSubdomain || null
    });
    const { token, user: userData } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const registerTenant = async (data) => {
    const response = await authAPI.registerTenant(data);
    return response.data.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerTenant, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
