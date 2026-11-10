"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Usuario } from "@/lib/api"; // <-- 1. Importamos TU interfaz oficial

interface AuthContextType {
  user: Usuario | null; // <-- 2. Usamos tu interfaz en lugar de crear una nueva
  token: string | null;
  loading: boolean;
  login: (userData: Usuario, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("petfy_usuario");
    const storedToken = localStorage.getItem("petfy_token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (userData: Usuario, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    
    localStorage.setItem("petfy_usuario", JSON.stringify(userData));
    localStorage.setItem("petfy_token", authToken);
    localStorage.setItem("petfy_logged", "true");

    if (userData.id_rol === 1) {
      router.push("/dashboard"); 
    } else if (userData.id_rol === 3) {
      router.push("/paseador");  
    } else {
      router.push("/perfil");    
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("petfy_usuario");
    localStorage.removeItem("petfy_token");
    localStorage.removeItem("petfy_logged");
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
}