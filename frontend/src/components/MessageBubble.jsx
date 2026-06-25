import { useAuth } from "../context/AuthContext";

const MessageBubble = ({ message }) => {
  const { authUser } = useAuth();
  const isMine = message.sender._id === authUser._id;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      {!isMine && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold mr-2 flex-shrink-0 self-end">
          {message.sender.username[0].toUpperCase()}
        </div>
      )}
      <div className={`max-w-xs lg:max-w-md ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm ${
            isMine
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-slate-700 text-slate-100 rounded-bl-sm"
          }`}
        >
          {message.text}
        </div>
        <span className="text-xs text-slate-500 mt-1 px-1">{time}</span>
      </div>
    </div>
  );
};

export default MessageBubble;