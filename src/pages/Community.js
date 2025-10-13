/* eslint-disable */
import React, { useEffect, useState } from "react";
import { db } from "../Firebase/Firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import { FiPlus } from "react-icons/fi";
import "./Pagescss/Community.css";

const Communities = () => {
  const [communities, setCommunities] = useState([]);
  const [newCommunity, setNewCommunity] = useState({ name: "", description: "" });
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: "guest",
    firstName: "Guest",
    lastName: "",
  };
  const userName = `${user.firstName} ${user.lastName}`.trim();

  // Fetch communities from Firestore
  useEffect(() => {
    const fetchCommunities = async () => {
      const snapshot = await getDocs(collection(db, "communities"));
      setCommunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCommunities();
  }, []);

  // Create a new community
  const handleCreate = async () => {
    if (!newCommunity.name.trim() || !newCommunity.description.trim()) return;

    await addDoc(collection(db, "communities"), {
      name: newCommunity.name,
      description: newCommunity.description,
      createdBy: user.id,
      createdByName: userName,
      members: [user.id],
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageTime: serverTimestamp(),
    });

    setNewCommunity({ name: "", description: "" });
    setShowForm(false);
    alert("Community created!");
  };

  // Join a community
  const handleJoin = async (communityId) => {
    const ref = doc(db, "communities", communityId);
    await updateDoc(ref, {
      members: arrayUnion(user.id),
      lastMessageTime: serverTimestamp(), // ensures chat shows in ChatsList
    });

    // Update local state immediately
    setCommunities(prev =>
      prev.map(c =>
        c.id === communityId ? { ...c, members: [...(c.members || []), user.id] } : c
      )
    );

    navigate(`/chat/${communityId}`);
  };

  return (
    <div className="community-container">
      <Navbar />

      <div className="header">
        <h2>Communities</h2>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          <FiPlus size={22} /> Add
        </button>
      </div>

      {showForm && (
        <div className="create-community">
          <input
            type="text"
            placeholder="Community name"
            value={newCommunity.name}
            onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Description"
            value={newCommunity.description}
            onChange={(e) =>
              setNewCommunity({ ...newCommunity, description: e.target.value })
            }
          />
          <button onClick={handleCreate}>Create</button>
        </div>
      )}

      <div className="community-list">
        {communities.map(c => {
          const isMember = c.members?.includes(user.id);
          return (
            <div key={c.id} className="community-row">
              <div className="community-info">
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                {c.createdByName && <p className="creator">Created by: {c.createdByName}</p>}
              </div>
              <button
                className={`join-btn ${isMember ? "joined" : ""}`}
                onClick={() => !isMember && handleJoin(c.id)}
                disabled={isMember}
              >
                {isMember ? "Joined" : "Join"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Communities;
