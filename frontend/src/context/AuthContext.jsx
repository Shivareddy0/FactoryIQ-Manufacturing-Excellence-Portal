import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
          const savedOverride = localStorage.getItem('roleOverride');
          setActiveRole(savedOverride || response.data.role);
        } catch (error) {
          console.error("Token verification failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, role, full_name, customer_account_id } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      const loggedUser = { email, role, full_name, customer_account_id };
      setUser(loggedUser);
      setActiveRole(role);
      localStorage.removeItem('roleOverride');
      setLoading(false);
      return loggedUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('roleOverride');
    setToken(null);
    setUser(null);
    setActiveRole(null);
  };

  const setOverrideRole = (role) => {
    localStorage.setItem('roleOverride', role);
    setActiveRole(role);
  };

  const clearOverrideRole = () => {
    localStorage.removeItem('roleOverride');
    if (user) {
      setActiveRole(user.role);
    }
  };

  const value = {
    user,
    token,
    activeRole,
    loading,
    login,
    logout,
    setOverrideRole,
    clearOverrideRole,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
