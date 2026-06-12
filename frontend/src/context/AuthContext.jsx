import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const getStoredUser = () => {
  const raw = localStorage.getItem('authUser');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
  }, [user]);

  const login = (payload) => {
    setUser(payload);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
