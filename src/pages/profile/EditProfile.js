/* eslint-disable */
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../../Firebase/Firebase";
import { updateEmail } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Navbar from "../../components/NavBar";
import "../Pagescss/EditProfile.css";

const EditProfile = () => {
  const user = auth.currentUser;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || user.email);
        setPhoneNumber(data.phoneNumber || "");
        setPhotoURL(data.photoURL || "");
      }
    };
    fetchData();
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (email !== user.email) await updateEmail(user, email);
      await updateDoc(doc(db, "users", user.uid), { firstName, lastName, email, phoneNumber, photoURL });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    if (!e.target.files[0]) return;
    const file = e.target.files[0];
    const storageRef = ref(storage, `profilePics/${user.uid}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setPhotoURL(url);
  };

  return (
 <div className="editprofile-wrapper">
  <Navbar />
  <div className="editprofile-card">
    <h1>Edit Profile</h1>
    <form onSubmit={handleUpdate} className="editprofile-form">
      <div className="editprofile-photo-section">
        {photoURL ? (
          <img src={photoURL} alt="Profile" className="editprofile-photo" />
        ) : (
          <div className="editprofile-placeholder">No Image</div>
        )}
        <input type="file" accept="image/*" onChange={handlePhotoUpload} />
      </div>

      <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      <button type="submit" disabled={loading} className="editprofile-btn">
        {loading ? "Updating..." : "Update Profile"}
      </button>
    </form>
  </div>
</div>

  );
};

export default EditProfile;
