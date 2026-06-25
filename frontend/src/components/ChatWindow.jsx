import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axiosInstance from "../utils/axiosInstance";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const ChatWindow = ({ selectedUser }) => {
  const { authUser } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/messages/${selectedUser._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
    setIsTyping(false);
  }, [selectedUser]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.sender._id === selectedUser?._id) {
        setMessages((prev) => [...prev, message]);
        setIsTyping(false);
      }
    };

    const handleTyping = ({ senderId }) => {
      if (senderId === selectedUser?._id) setIsTyping(true);
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId === selectedUser?._id) setIsTyping(false);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleTyping = useCallback(
    (e) => {
      setText(e.target.value);
      if (!socket || !selectedUser) return;
      socket.emit("typing", { receiverId: selectedUser._id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { receiverId: selectedUser._id });
      }, 1500);
    },
    [socket, selectedUser]
  );

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUser) return;

    const messageText = text.trim();
    setText("");
    clearTimeout(typingTimeoutRef.current);
    socket?.emit("stopTyping", { receiverId: selectedUser._id });

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        { text: messageText }
      );
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setText(messageText);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Select a conversation
          </h3>
          <p className="text-slate-400">
            Choose a user from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900 h-full">
      <div className="px-6 py-4 border-b border-slate-700 bg-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
          {selectedUser.username[0].toUpperCase()}
        </div>
        <div>
          <h3 className="text-white font-semibold">{selectedUser.username}</h3>
          <p className="text-xs text-slate-400">{selectedUser.email}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg._id} message={msg} />)
        )}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-800">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={text}
            onChange={handleTyping}
            placeholder={`Message ${selectedUser.username}...`}
            className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium text-sm"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;