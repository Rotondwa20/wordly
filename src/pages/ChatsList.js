/* eslint-disable */
import React, { useEffect, useState } from "react";
import { db } from "../Firebase/Firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import "./Pagescss/ChatsList.css";

const ChatsList = () => {
  const [chats, setChats] = useState([]);
  const user = JSON.parse(localStorage.getItem("loggedInUser")) || { id: "guest" };
  const userId = user.id;
  const navigate = useNavigate();

  // Fetch chats the user is part of in real-time
  useEffect(() => {
    if (userId === "guest") return;

    const chatsRef = collection(db, "communities");
    const q = query(
      chatsRef,
      where("members", "array-contains", userId),
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleClick = (chat) => {
    navigate(`/messages/${chat.id}`, { state: { chat } }); // navigate to message page
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      return timestamp.toDate 
        ? timestamp.toDate().toLocaleString() 
        : new Date(timestamp).toLocaleString();
    } catch {
      return "";
    }
  };

  return (
    <div className="chatslist-container">
      <Navbar />
      <div className="chatslist-wrapper">
        <h2>Chats</h2>
        {chats.length === 0 ? (
          <p className="no-chats">No chats available.</p>
        ) : (
          <div className="chat-cards">
            {chats.map(chat => (
              <div 
                key={chat.id} 
                className="chat-card" 
                onClick={() => handleClick(chat)}
              >
                <div className="chat-info">
                  <h3>{chat.name || "Unnamed Community"}</h3>
                  <p className="last-message">{chat.lastMessage || "No messages yet."}</p>
                </div>
                <small className="chat-time">{formatTime(chat.lastMessageTime)}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatsList;
