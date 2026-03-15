/* eslint-disable */
import React, { useEffect, useState } from "react";
import { db } from "../Firebase/Firebase";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import "./Pagescss/ChatsList.css";

const ChatsList = () => {
  const [communityChats, setCommunityChats] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [privateUsersData, setPrivateUsersData] = useState({});
  const [activeTab, setActiveTab] = useState("community");

  const user = JSON.parse(localStorage.getItem("loggedInUser")) || { id: "guest" };
  const userId = user.id;
  const navigate = useNavigate();

  // Fetch community chats
  useEffect(() => {
    if (userId === "guest") return;

    const chatsRef = collection(db, "communities");
    const q = query(chatsRef, where("members", "array-contains", userId), orderBy("lastMessageTime", "desc"));

    const unsub = onSnapshot(q, snapshot => {
      setCommunityChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [userId]);

  // Fetch private 1-on-1 chats
  useEffect(() => {
    if (userId === "guest") return;

    const privateRef = collection(db, "privateChats");
    const q = query(privateRef, where("members", "array-contains", userId), orderBy("lastMessageTime", "desc"));

    const unsub = onSnapshot(q, async snapshot => {
      const chats = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(chat => chat.members?.length === 2); // Only 1-on-1

      const usersData = {};
      for (let chat of chats) {
        const otherUserId = chat.members.find(id => id !== userId);
        if (!usersData[otherUserId]) {
          const userDoc = await getDoc(doc(db, "users", otherUserId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            usersData[otherUserId] = {
              name: `${data.firstName} ${data.lastName}`,
              photo: data.photo || null,
            };
          } else {
            usersData[otherUserId] = { name: "Unknown", photo: null };
          }
        }
      }

      setPrivateUsersData(usersData);
      setPrivateChats(chats);
    });

    return () => unsub();
  }, [userId]);

  // Handle click navigation
  const handleClick = (chat, type) => {
    if (type === "private") {
      navigate(`/privatemessages/${chat.id}`, { state: { chat, chatType: type } });
    } else {
      navigate(`/messages/${chat.id}`, { state: { chat, chatType: type } });
    }
  };

  // Format timestamp to HH:MM
  const formatTime = timestamp => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Render a single chat card
  const renderChatCard = (chat, type) => {
    if (type === "private") {
      const otherUserId = chat.members.find(id => id !== userId);
      const otherUser = privateUsersData[otherUserId] || { name: "Unknown", photo: null };
      const lastMsg = chat.lastMessage || "";
      const lastMsgMine = chat.lastMessageSender === userId;
      const seenStatus = lastMsgMine ? (chat.lastMessageSeen ? "✔✔" : "✔") : "";

      return (
        <div key={chat.id} className="chat-card" onClick={() => handleClick(chat, type)}>
          <div className="chat-avatar">
            {otherUser.photo ? (
              <img src={otherUser.photo} alt="avatar" className="avatar-image" />
            ) : (
              <div className="avatar-initials">{otherUser.name.slice(0, 2).toUpperCase()}</div>
            )}
          </div>
          <div className="chat-info">
            <h3>{otherUser.name}</h3>
            <p className="last-message">{lastMsgMine && "You: "} {lastMsg} {seenStatus}</p>
          </div>
          <small className="chat-time">{formatTime(chat.lastMessageTime)}</small>
        </div>
      );
    } else {
      return (
        <div key={chat.id} className="chat-card" onClick={() => handleClick(chat, type)}>
          <div className="chat-info">
            <h3>{chat.name || "Unnamed Community"}</h3>
            <p className="last-message">{chat.lastMessage || "No messages yet."}</p>
          </div>
          <small className="chat-time">{formatTime(chat.lastMessageTime)}</small>
        </div>
      );
    }
  };

  return (
    <div className="chatslist-container">
      <Navbar />
      <div className="chatslist-wrapper">
        {/* Tabs */}
        <div className="chat-tabs">
          <button className={activeTab === "community" ? "active" : ""} onClick={() => setActiveTab("community")}>Community</button>
          <button className={activeTab === "private" ? "active" : ""} onClick={() => setActiveTab("private")}>Private</button>
        </div>

        {/* Chat Lists */}
        <div className="chat-cards">
          {activeTab === "community"
            ? communityChats.length === 0
              ? <p className="no-chats">No community chats available.</p>
              : communityChats.map(chat => renderChatCard(chat, "community"))
            : privateChats.length === 0
              ? <p className="no-chats">No private chats yet.</p>
              : privateChats.map(chat => renderChatCard(chat, "private"))
          }
        </div>
      </div>
    </div>
  );
};

export default ChatsList;