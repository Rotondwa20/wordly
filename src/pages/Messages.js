/* eslint-disable */
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "../Firebase/Firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import Navbar from "../components/NavBar";
import "./Pagescss/Messages.css";

const Messages = () => {
  const { id: communityId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [membersCount, setMembersCount] = useState(0);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesRefMap = useRef({});

  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: "guest",
    firstName: "Guest",
    lastName: "",
    photo: null
  };
  const userId = user.id;
  const userName = `${user.firstName} ${user.lastName}`.trim();

  // ==============================
  // RANDOM PASTEL COLOR PER USER
  // ==============================
  const colors = ["#e3f2fd","#fce4ec","#e8f5e9","#fff3e0","#ede7f6","#e0f7fa"];
  const getUserColor = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash % colors.length)];
  };

  // ==============================
  // FETCH COMMUNITY INFO
  // ==============================
  useEffect(() => {
    const fetchCommunity = async () => {
      const communityDoc = await getDoc(doc(db, "communities", communityId));
      if (communityDoc.exists()) {
        const data = communityDoc.data();
        setCommunityName(data.name);
        setCommunityDescription(data.description || "");
        setMembersCount(data.members?.length || 0);
      }
    };
    fetchCommunity();
  }, [communityId]);

  // ==============================
  // LISTEN TO MESSAGES
  // ==============================
  useEffect(() => {
    const messagesRef = collection(db, "communities", communityId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, async snapshot => {
      const msgs = await Promise.all(
        snapshot.docs.map(async docSnap => {
          const data = docSnap.data();
          let photo = null;
          let displayName = "Guest";

          if (data.senderId) {
            const userDoc = await getDoc(doc(db, "users", data.senderId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              displayName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Guest";
              if (userData.photos?.[0]) {
                const firstPhoto = userData.photos[0];
                if (firstPhoto.startsWith("data:image/")) {
                  photo = firstPhoto;
                } else {
                  try {
                    const photoRef = ref(storage, `profilePictures/${firstPhoto}`);
                    photo = await getDownloadURL(photoRef);
                  } catch (err) {
                    console.log("Photo error", err);
                  }
                }
              }
            }
          }

          return { id: docSnap.id, ...data, photo, displayName };
        })
      );
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [communityId]);

  // ==============================
  // AUTO SCROLL TO BOTTOM
  // ==============================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ==============================
  // SEND OR EDIT MESSAGE
  // ==============================
  const sendMessage = async () => {
    if (!text.trim()) return;

    if (editingMessage) {
      await updateDoc(doc(db, "communities", communityId, "messages", editingMessage.id), {
        text,
        edited: true
      });
      setEditingMessage(null);
    } else {
      await addDoc(collection(db, "communities", communityId, "messages"), {
        text,
        senderId: userId,
        userName,
        timestamp: serverTimestamp(),
        repliedTo: replyingTo?.id || null
      });
    }

    setText("");
    setReplyingTo(null);
  };

  // ==============================
  // DELETE MESSAGE
  // ==============================
  const deleteMessage = async messageId => {
    if (!window.confirm("Delete this message?")) return;
    await deleteDoc(doc(db, "communities", communityId, "messages", messageId));
    setSelectedMessage(null);
  };

  // ==============================
  // VIEW PROFILE
  // ==============================
  const viewProfile = id => {
    navigate(`/ViewProfile/${id}`);
    setSelectedMessage(null);
  };

  // ==============================
  // FORMAT DATE / TIME
  // ==============================
  const formatDate = timestamp => timestamp ? timestamp.toDate().toLocaleDateString() : "";
  const formatTime = timestamp => timestamp ? timestamp.toDate().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "";

  // ==============================
  // SCROLL TO SPECIFIC MESSAGE
  // ==============================
  const scrollToMessage = id => {
    const ref = messagesRefMap.current[id];
    if (ref) ref.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  let lastDate = "";

  return (
    <div className="messages-container">
      <Navbar />
      <div className="chat-box">
        {/* HEADER */}
        <div className="chat-header">
          <div className="community-details">
            <h2>{communityName || "Community Chat"}</h2>
            <p className="community-description">{communityDescription}</p>
          </div>
          <div className="community-info">👥 {membersCount}</div>
        </div>

        {/* MESSAGES */}
        <div className="messages">
          {messages.map(msg => {
            const date = formatDate(msg.timestamp);
            const showDate = date !== lastDate;
            lastDate = date;

            const isMine = msg.senderId === userId;
            const repliedMessage = msg.repliedTo ? messages.find(m => m.id === msg.repliedTo) : null;
            const initials = msg.displayName.split(" ").map(n => n[0]).join("").toUpperCase();
            const bubbleColor = isMine ? "#0ca2ff" : getUserColor(msg.senderId || "guest");

            return (
              <div key={msg.id} ref={el => messagesRefMap.current[msg.id] = el}>
                {showDate && <div className="date-divider">{date}</div>}

                <div className={`message-row ${isMine ? "mine" : "theirs"}`}
                     onClick={() => setSelectedMessage(selectedMessage === msg.id ? null : msg.id)}>
                  {/* AVATAR */}
                  {msg.photo ? (
                    <img src={msg.photo} alt="avatar" className="message-avatar" />
                  ) : (
                    <div className="message-avatar initials" style={{ backgroundColor: getUserColor(msg.senderId || "guest") }}>
                      {initials}
                    </div>
                  )}

                  {/* MESSAGE BUBBLE */}
                  <div className="message-bubble" style={{ backgroundColor: bubbleColor, color: "#212121" }}>
                    <div className="message-name">{msg.displayName}</div>
                    {repliedMessage && (
                      <div className="replied-message" onClick={() => scrollToMessage(repliedMessage.id)}>
                        <strong>@{repliedMessage.displayName}:</strong> {repliedMessage.text}
                      </div>
                    )}
                    <div className="message-text">{msg.text}</div>
                    {msg.edited && <div className="edited-tag">edited</div>}
                    <div className="message-time">{formatTime(msg.timestamp)}</div>

                    {/* DROPDOWN */}
                    {selectedMessage === msg.id && (
                      <div className="message-dropdown" onClick={e => e.stopPropagation()}>
                        <div className="dropdown-close" onClick={() => setSelectedMessage(null)}>×</div>
                        <button onClick={() => viewProfile(msg.senderId)}>View Profile</button>
                        {!isMine && <button onClick={() => setReplyingTo(msg)}>Reply</button>}
                        {isMine && <>
                          <button onClick={() => deleteMessage(msg.id)}>Delete</button>
                          <button onClick={() => { setEditingMessage(msg); setText(msg.text); }}>Edit</button>
                        </>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* REPLY BOX */}
        {replyingTo && (
          <div className="replying-box">
            Replying to <strong>@{replyingTo.displayName}</strong>: {replyingTo.text}
            <button onClick={() => setReplyingTo(null)}>Cancel</button>
          </div>
        )}

        {/* SEND BOX */}
        <div className="send-box">
          <input
            type="text"
            placeholder="Type message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyPress={e => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>{editingMessage ? "Save" : "Send"}</button>
        </div>
      </div>
    </div>
  );
};

export default Messages;