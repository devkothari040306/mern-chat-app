import jwt from "jsonwebtoken";

let ioInstance = null;
const onlineUsers = new Map();

const getTokenFromSocket = (socket) => {
  const authToken = socket.handshake.auth?.token;
  const queryToken = socket.handshake.query?.token;
  return authToken || queryToken || null;
};

const broadcastPresence = (userId, online) => {
  const onlineUserIds = Array.from(onlineUsers.keys());
  ioInstance.emit("onlineUsers", onlineUserIds);
  ioInstance.emit("userStatus", { userId, online });
};

export const initSocket = (io) => {
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token = getTokenFromSocket(socket);

      if (!token) {
        return next(new Error("Socket authorization token is required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Invalid socket token"));
    }
  });

  io.on("connection", (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    socket.join(socket.userId);
    broadcastPresence(socket.userId, true);

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.userId);
      broadcastPresence(socket.userId, false);
    });
  });
};

export const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance) {
    return false;
  }

  ioInstance.to(String(userId)).emit(eventName, payload);
  return true;
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(String(userId));
};
