import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axiosInstance from "../utils/axiosInstance";

const Sidebar = ({ selectedUser, onSelectUser }) => {
  const { authUser, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const isOnline = (userId) => onlineUsers.includes(userId);

  return (
    <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Chats</h2>
          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <p className="text-slate-400 text-sm text-center mt-8">No users found</p>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              onClick={() => onSelectUser(user)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-700 transition-colors border-b border-slate-700/50 ${
                selectedUser?._id === user._id ? "bg-slate-700" : ""
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user.username[0].toUpperCase()}
                </div>
                {isOnline(user._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user.username}
                </p>
                <p className={`text-xs ${isOnline(user._id) ? "text-green-400" : "text-slate-400"}`}>
                  {isOnline(user._id) ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
          {authUser?.username[0].toUpperCase()}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{authUser?.username}</p>
          <p className="text-green-400 text-xs">Online</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;