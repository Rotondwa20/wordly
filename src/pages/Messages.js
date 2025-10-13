/* eslint-disable */
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
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
import "./Pagescss/Messages.css";

const Messages = () => {
  const { id: communityId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [communityName, setCommunityName] = useState("");
  const messagesEndRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: "guest",
    firstName: "Guest",
    lastName: "",
  };
  const userId = user.id;
  const userName = `${user.firstName} ${user.lastName}`.trim();

  // Fetch community name
  useEffect(() => {
    const fetchCommunityName = async () => {
      const communityDoc = await getDoc(doc(db, "communities", communityId));
      if (communityDoc.exists()) {
        setCommunityName(communityDoc.data().name);
      }
    };
    fetchCommunityName();
  }, [communityId]);

  // Listen for messages in real-time
  useEffect(() => {
    const messagesRef = collection(db, "communities", communityId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [communityId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a message
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "communities", communityId, "messages"), {
      text,
      senderId: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      userName,
      timestamp: serverTimestamp(),
    });

    setText("");
  };

  return (
    <div className="messages-container">
      <Navbar />
      <div className="chat-box">
        <h2 className="community-title">{communityName || "Community Chat"}</h2>

        <div className="messages">
          {messages.map((msg) => {
            const isMine = msg.senderId === userId;
            return (
              <div key={msg.id} className={`message ${isMine ? "mine" : "theirs"}`}>
                {!isMine && <div className="message-user">{msg.userName || "Guest"}</div>}
                <div className="message-text">{msg.text}</div>
                {isMine && <div className="message-user mine-user">{msg.userName || "You"}</div>}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

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

export default Messages;
