/* eslint-disable */
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../Firebase/Firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import Navbar from "../components/NavBar";
import "./Pagescss/PrivateMessages.css";

const PrivateMessage = () => {
  const { id } = useParams(); // privateChatId
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState({ name: "Loading...", lastSeen: null });
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("loggedInUser")) || { id: "guest", firstName: "Guest" };
  const userId = user.id;

  /** Format timestamp into hh:mm */
  const formatTime = (ts) =>
    ts ? new Date(ts.toDate ? ts.toDate() : ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  /** Format last seen dynamically */
  const formatLastSeen = (ts) => {
    if (!ts) return "Last seen unknown";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return "Last seen just now";
    if (diff < 3600) return `Last seen ${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)} hr ago`;
    return `Last seen on ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  /** Fetch other user info and listen to lastSeen in real-time */
  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const chatDoc = await getDoc(doc(db, "privateChats", id));
        if (!chatDoc.exists()) return;

        const chatData = chatDoc.data();
        const otherUserId = chatData.members?.find((m) => m !== userId);
        if (!otherUserId) return;

        // Listen to other user's document for real-time lastSeen
        const unsub = onSnapshot(doc(db, "users", otherUserId), (userDoc) => {
          if (!userDoc.exists()) return;

          const data = userDoc.data();
          setOtherUser({
            id: otherUserId,
            name: `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unknown User",
            photo: data.photos?.[0] || "",
            lastSeen: data.lastSeen || null,
            online: data.online || false,
          });
        });

        return () => unsub();
      } catch (err) {
        console.error("Error fetching other user:", err);
      }
    };

    fetchOtherUser();
  }, [id, userId]);

  /** Listen to messages in real-time */
  useEffect(() => {
    const messagesRef = collection(db, "privateChats", id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsub();
  }, [id]);

  /** Scroll to bottom when messages update */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** Send a message */
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "privateChats", id, "messages"), {
      senderId: userId,
      text,
      timestamp: serverTimestamp(),
      seen: false,
    });

    setText("");
  };

  return (
    <div className="private-message-container">
      <Navbar />

      <div className="chat-box">
        {/* Header */}
        <div
          className="chat-header"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/ViewProfile/${otherUser.id}`)}
        >
          {otherUser.photo ? (
            <img src={otherUser.photo} alt="avatar" className="avatar-image" />
          ) : (
            <div className="avatar-initials">{otherUser.name?.slice(0, 2).toUpperCase() || "GU"}</div>
          )}
          <div className="chat-header-info">
            <h2>{otherUser.name || "Chat"}</h2>
            <small>
              {otherUser.online ? "Online" : formatLastSeen(otherUser.lastSeen)}
            </small>
          </div>
        </div>

        {/* Messages */}
        <div className="messages">
          {messages.map((msg) => {
            const isMine = msg.senderId === userId;
            return (
              <div key={msg.id} className={`message-row ${isMine ? "mine" : "theirs"}`}>
                <div
                  className="message-bubble"
                  style={{
                    backgroundColor: isMine ? "#6397ff" : "#f1f0f0",
                    color: isMine ? "white" : "black",
                  }}
                >
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Send Box */}
        <div className="send-box">
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default PrivateMessage;