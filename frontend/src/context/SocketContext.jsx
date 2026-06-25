import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { authUser } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!authUser) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setOnlineUsers([]);
      return;
    }

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      query: { userId: authUser._id },
      withCredentials: true,
    });

    socketRef.current.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);