import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { storage } from "../utils/storage";
import { setToken } from "../api/client";          // <-- ДОБАВЬ ЭТО

import {
  login as apiLogin,
  register as apiRegister,
  me as apiMe,
  logout as apiLogout,
} from "../api/auth";

type User = { id: string; email: string; fullName?: string; roles: string[] };

type Ctx = {
  user: User | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string, role: "Specialist" | "Parent", fullName?: string): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<Ctx>({} as any);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Авто-логин по сохраненному токену
  useEffect(() => {
    (async () => {
      const token = await storage.getItem("accessToken");
      if (token) {
        await setToken(token);              // <-- ВАЖНО: проставляем заголовок Authorization и сохраняем в storage (если setToken так делает)
        try {
          const me = await apiMe();
          setUser(me);
        } catch {
          await apiLogout();
          await setToken(null);             // <-- снимаем токен
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);        // <-- внутри login уже вызывается setToken(accessToken)
    const me = await apiMe();
    setUser(me);
  };

  const register = async (email: string, password: string, role: "Specialist" | "Parent", fullName?: string) => {
    await apiRegister(email, password, role, fullName); // <-- setToken тоже вызывается
    const me = await apiMe();
    setUser(me);
  };

  const logout = async () => {
    await apiLogout();
    await setToken(null);                   // <-- этого достаточно; отдельный storage.deleteItem не нужен
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
