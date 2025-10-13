/* eslint-disable */
import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import { FiBell } from "react-icons/fi";
import Navbar from "../components/NavBar";
import { useNavigate } from "react-router-dom";
import "./Pagescss/Notifications.css";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: "guest",
    firstName: "Guest",
    lastName: "",
  };
  const userId = user.id;

  // Fetch notifications for logged-in user
  useEffect(() => {
    if (userId === "guest") return; // skip for guest

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("receiverId", "==", userId),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched notifications:", notifs); // debug
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [userId]);

  // Handle clicking a notification
  const handleClick = async (notif) => {
    if (notif.postId) {
      navigate(`/viewblog/${notif.postId}`);
    }

    // Mark notification as read
    if (!notif.read) {
      const notifRef = doc(db, "notifications", notif.id);
      await updateDoc(notifRef, { read: true });
    }
  };

  return (
    <div className="notifications-container">
      <Navbar />
      <div className="notifications-wrapper">
        <h2>
          <FiBell /> Notifications
        </h2>

        {notifications.length === 0 ? (
          <p className="no-notifications">No notifications yet.</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-card ${notif.read ? "read" : "unread"}`}
              onClick={() => handleClick(notif)}
            >
              <p>
                <strong>{notif.senderName || "Someone"}</strong>{" "}
                {notif.type === "like" && "liked your post"}
                {notif.type === "comment" && "commented on your post"}
                {notif.type === "reply" && "replied to your comment"}
              </p>
              <small>{notif.timestamp?.toDate().toLocaleString() || "Just now"}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
