import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { onhub } from '@/api/onhubClient';

const AuthContext = createContext();

// Check auth synchronously from localStorage to avoid flash
const getInitialAuthState = () => {
  try {
    const isLoggedIn = localStorage.getItem('onhub_is_logged_in') === 'true';
    if (isLoggedIn) {
      const userData = localStorage.getItem('onhub_current_user');
      if (userData) {
        return { user: JSON.parse(userData), isAuthenticated: true };
      }
    }
  } catch (e) {
    console.error('Error reading initial auth state:', e);
  }
  return { user: null, isAuthenticated: false };
};

export const AuthProvider = ({ children }) => {
  const initialState = useMemo(() => getInitialAuthState(), []);
  
  const [user, setUser] = useState(initialState.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false); // Start as false since we read synchronously
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({});

  const checkAuth = async () => {
    try {
      setAuthError(null);
      
      const currentUser = await onhub.auth.me();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const login = async (username, password) => {
    try {
      setAuthError(null);
      const loggedInUser = await onhub.auth.login(username, password);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      setAuthError({ type: 'invalid_credentials', message: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = async (shouldRedirect = true) => {
    await onhub.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    // No external redirect needed, login is in-app
    window.location.href = '/';
  };

  const checkAppState = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      login,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
