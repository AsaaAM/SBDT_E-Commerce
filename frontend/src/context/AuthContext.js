'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

const AuthContext = createContext(null);

const DEMO_ACCOUNTS = {
  user: { email: 'buyer@ikea-sbdt.local', pass: 'User123!', label: 'Siti Pembeli' },
  warehouse: { email: 'gudang@ikea-sbdt.local', pass: 'Gudang123!', label: 'Ahmad Gudang' },
  admin: { email: 'admin@ikea-sbdt.local', pass: 'Admin123!', label: 'Dewi Admin' },
  owner: { email: 'owner@ikea-sbdt.local', pass: 'Owner123!', label: 'Hendra Owner' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('ikea_token');
    const savedUser = localStorage.getItem('ikea_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('ikea_token');
        localStorage.removeItem('ikea_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      const { user: userData, token: userToken } = res.data;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('ikea_token', userToken);
      localStorage.setItem('ikea_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Login gagal.');
  };

  const register = async (userData) => {
    const res = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (res.success && res.data) {
      const { user: newUser, token: newToken } = res.data;
      setUser(newUser);
      setToken(newToken);
      localStorage.setItem('ikea_token', newToken);
      localStorage.setItem('ikea_user', JSON.stringify(newUser));
      return newUser;
    }
    throw new Error(res.message || 'Registrasi gagal.');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ikea_token');
    localStorage.removeItem('ikea_user');
  };

  const switchRole = async (targetRole) => {
    const creds = DEMO_ACCOUNTS[targetRole];
    if (!creds) return;
    try {
      setLoading(true);
      await login(creds.email, creds.pass);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchRole,
        DEMO_ACCOUNTS,
        isAuthenticated: !!user,
        isUser: user?.role === 'user',
        isWarehouse: user?.role === 'warehouse',
        isAdmin: user?.role === 'admin',
        isOwner: user?.role === 'owner',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
