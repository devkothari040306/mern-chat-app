import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axiosInstance.get("/users/me");
        setAuthUser(res.data);
      } catch {
        setAuthUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await axiosInstance.post("/auth/login", { email, password });
    setAuthUser(res.data);
    return res.data;
  };

  const register = async (username, email, password) => {
    const res = await axiosInstance.post("/auth/register", {
      username,
      email,
      password,
    });
    setAuthUser(res.data);
    return res.data;
  };

  const logout = async () => {
    await axiosInstance.post("/auth/logout");
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ authUser, setAuthUser, isCheckingAuth, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);