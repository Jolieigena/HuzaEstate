"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthContextValue {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  isApprovedSeller: boolean;
  applyAsSeller: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "huzaestate_auth";
const SELLER_STORAGE_KEY = "huzaestate_seller";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isApprovedSeller, setIsApprovedSeller] = useState(false);

  useEffect(() => {
    try {
      setIsLoggedIn(localStorage.getItem(STORAGE_KEY) === "true");
      setIsApprovedSeller(localStorage.getItem(SELLER_STORAGE_KEY) === "true");
    } catch {
      // localStorage unavailable, stay logged out
    }
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const applyAsSeller = () => {
    setIsApprovedSeller(true);
    try {
      localStorage.setItem(SELLER_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, isApprovedSeller, applyAsSeller }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
