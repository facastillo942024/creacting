import { createContext, useState, useEffect, useCallback } from "react";
import { api, setToken, getToken } from "../api/client";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, email, rol, nombre }
  const [cargando, setCargando] = useState(true); // true mientras validamos el token guardado

  // Al montar: si hay token guardado, recuperamos el usuario con /me.
  useEffect(() => {
    let activo = true;
    async function init() {
      if (!getToken()) {
        setCargando(false);
        return;
      }
      try {
        const { usuario } = await api.me();
        if (activo) setUser(usuario);
      } catch {
        // token invalido/expirado
        setToken("");
        if (activo) setUser(null);
      } finally {
        if (activo) setCargando(false);
      }
    }
    init();
    return () => {
      activo = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, usuario } = await api.login({ email, password });
    setToken(token);
    setUser(usuario);
    return usuario;
  }, []);

  const register = useCallback(async (datos) => {
    const { token, usuario } = await api.register(datos);
    setToken(token);
    setUser(usuario);
    return usuario;
  }, []);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
  }, []);

  const contextValue = {
    user,
    cargando,
    isAuth: !!user,
    rol: user?.rol || null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
