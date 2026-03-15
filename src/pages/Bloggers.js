/* eslint-disable */
import React, { useEffect, useState } from "react";
import { auth, db } from "../Firebase/Firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import "./Pagescss/Bloggers.css";

const Bloggers = () => {
  const [activeTab, setActiveTab] = useState("followers");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  // Fetch all users
  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsers = usersSnapshot.docs
          .map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }))
          .filter(u => u.uid !== currentUser.uid); // exclude self
        setUsers(allUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
      setLoading(false);
    };

    fetchUsers();
  }, [currentUser]);

  const handleFollow = async (uidToFollow) => {
    if (!currentUser) return;
    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      const userToFollowRef = doc(db, "users", uidToFollow);

      // Update Firestore
      await updateDoc(currentUserRef, { following: arrayUnion(uidToFollow) });
      await updateDoc(userToFollowRef, { followers: arrayUnion(currentUser.uid) });

      // Update local state immediately
      setUsers(prev =>
        prev.map(u => u.uid === uidToFollow ? { ...u, followers: [...(u.followers || []), currentUser.uid] } : u)
      );
    } catch (err) {
      console.error("Failed to follow user:", err);
    }
  };

  const handleUnfollow = async (uidToUnfollow) => {
    if (!currentUser) return;
    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      const userToUnfollowRef = doc(db, "users", uidToUnfollow);

      // Update Firestore
      await updateDoc(currentUserRef, { following: arrayRemove(uidToUnfollow) });
      await updateDoc(userToUnfollowRef, { followers: arrayRemove(currentUser.uid) });

      // Update local state immediately
      setUsers(prev =>
        prev.map(u => u.uid === uidToUnfollow ? { ...u, followers: (u.followers || []).filter(f => f !== currentUser.uid) } : u)
      );
    } catch (err) {
      console.error("Failed to unfollow user:", err);
    }
  };

  // Compute totals
  const currentUserData = users.find(u => u.uid === currentUser?.uid) || { following: [] };
  const totalFollowers = users.filter(u => u.followers?.includes(currentUser?.uid)).length;
  const totalFollowing = currentUserData.following?.length || 0;

  const renderUsers = () => {
    if (!currentUser) return <p>Please log in.</p>;

    let filteredUsers = [];

    if (activeTab === "followers") {
      filteredUsers = users.filter(u => u.followers?.includes(currentUser.uid));
    } else if (activeTab === "following") {
      filteredUsers = users.filter(u => currentUserData.following?.includes(u.uid));
    } else if (activeTab === "suggested") {
      filteredUsers = users.filter(u => !(currentUserData.following?.includes(u.uid)));
    }

    if (filteredUsers.length === 0) return <p>No users found.</p>;

    return filteredUsers.map(u => (
      <div key={u.uid} className="user-item">
        <div className="user-avatar" onClick={() => navigate(`/viewprofile/${u.uid}`)}>
          {u.photos?.length > 0 ? (
            <img src={u.photos[0]} alt={u.displayName || u.firstName} />
          ) : (
            <div className="avatar-placeholder">
              {u.firstName ? u.firstName[0].toUpperCase() : "S"}
            </div>
          )}
        </div>
        <div className="user-info" onClick={() => navigate(`/viewprofile/${u.uid}`)}>
          <p className="user-name">{u.displayName || `${u.firstName} ${u.lastName}`}</p>
        </div>
        <div className="user-action">
          {activeTab === "following" && (
            <button className="unfollow-btn" onClick={() => handleUnfollow(u.uid)}>
              Unfollow
            </button>
          )}
          {activeTab === "suggested" && (
            <button className="follow-btn" onClick={() => handleFollow(u.uid)}>
              Follow
            </button>
          )}
        </div>
      </div>
    ));
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="bloggers-page">
      <Navbar />

    

      {/* Tabs */}
      <div className="tabs">
        <button className={activeTab === "followers" ? "active" : ""} onClick={() => setActiveTab("followers")}>
          Followers
        </button>
        <button className={activeTab === "following" ? "active" : ""} onClick={() => setActiveTab("following")}>
          Following
        </button>
        <button className={activeTab === "suggested" ? "active" : ""} onClick={() => setActiveTab("suggested")}>
          Suggested
        </button>
      </div>

      <div className="users-list">{renderUsers()}</div>
    </div>
  );
};

export default Bloggers;