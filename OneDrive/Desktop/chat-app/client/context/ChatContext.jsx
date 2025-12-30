import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const { socket, axios } = useContext(AuthContext);

  // function to get all user for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data?.success) {
        setUsers(data.users || []);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      toast.error(error.message || "Failed to load users");
    }
  };

  // function to get messages for a selected user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data?.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load messages");
    }
  };

  // send message function
  const sendMessage = async ({ text, image, receiverId }) => {
    try {
      const { data } = await axios.post(`/api/messages/send/${receiverId}`, { text, image });
      if (data?.success) {
        setMessages((prev) => [...prev, data.newMessage]);
        // update unseen messages if needed
      }
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    }
  };

  // handle socket incoming messages (example usage)
  useEffect(() => {
    if (!socket) return;
    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        setMessages((prev) => [...prev, newMessage]);
      } else {
        // update unseenMessages count
        setUnseenMessages((prev) => {
          const key = newMessage.senderId;
          return { ...prev, [key]: (prev[key] || 0) + 1 };
        });
      }
    });

    return () => {
      socket.off("newMessage");
    };
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
