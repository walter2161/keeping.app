import React, { createContext, useState, useContext, useEffect } from 'react';
import { localDB } from '@/lib/localStorageDB';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      
      // Check if user is already logged in
      const isAuth = localDB.auth.isAuthenticated();
      
      if (isAuth) {
        const currentUser = localDB.auth.me();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          setShowLogin(false);
        } else {
          setIsAuthenticated(false);
          setShowLogin(true);
        }
      } else {
        setIsAuthenticated(false);
        setShowLogin(true);
      }
      
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setShowLogin(true);
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoadingAuth(true);
      const loggedInUser = localDB.auth.login(email, password);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      setShowLogin(false);
      setAuthError(null);
      setIsLoadingAuth(false);
      return { success: true };
    } catch (error) {
      setIsLoadingAuth(false);
      setAuthError({
        type: 'invalid_credentials',
        message: error.message || 'Credenciais inválidas'
      });
      return { success: false, error: error.message };
    }
  };

  const logout = (shouldRedirect = true) => {
    localDB.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setShowLogin(true);
  };

  const navigateToLogin = () => {
    setShowLogin(true);
  };

  const updateUser = async (data) => {
    try {
      const updatedUser = localDB.auth.updateMe(data);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      showLogin,
      login,
      logout,
      navigateToLogin,
      checkAppState,
      updateUser,
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
