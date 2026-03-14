/* eslint-disable */
import React, { useEffect, useState } from "react";
import { auth, db } from "../../Firebase/Firebase";
import { updateEmail } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import Navbar from "../../components/NavBar";
import "../Pagescss/EditProfile.css";

const EditProfile = () => {
  const user = auth.currentUser;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [photos, setPhotos] = useState([]); // Array of Base64 images

  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setEmail(data.email || user.email);
          setPhoneNumber(data.phoneNumber || "");
          setPhotos(data.photos || []);
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
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

      await updateDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email,
        phoneNumber,
        photos,
      });

      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
    setLoading(false);
  };

  // Convert file to Base64 and compress if needed
  const handlePhotoUpload = (e) => {
    if (!e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadstart = () => setPhotoLoading(true);
    reader.onloadend = async () => {
      let img = new Image();
      img.src = reader.result;

      img.onload = async () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        // Resize keeping aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        // Draw to canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Base64 (jpeg) with compression
        let base64String = canvas.toDataURL("image/jpeg", 0.7); // 70% quality

        // Reduce further if too large
        while (base64String.length / 1024 > 1024) { // >1MB
          base64String = canvas.toDataURL("image/jpeg", 0.6); // reduce quality
        }

        try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, { photos: arrayUnion(base64String) });
          setPhotos((prev) => [...prev, base64String]);
        } catch (err) {
          console.error("Error uploading photo:", err);
          alert("Failed to upload photo.");
        }
        setPhotoLoading(false);
      };
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="editprofile-wrapper">
      <Navbar />
      <div className="editprofile-card">
        <h1>Edit Profile</h1>
        <form onSubmit={handleUpdate} className="editprofile-form">
          {/* Photo Section */}
          <div className="editprofile-photo-section">
            {photoLoading ? (
              <div className="editprofile-spinner">Uploading...</div>
            ) : photos.length > 0 ? (
              photos.map((p, idx) => (
                <img key={idx} src={p} alt={`Photo ${idx + 1}`} className="editprofile-photo" />
              ))
            ) : (
              <div className="editprofile-placeholder">No Images</div>
            )}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} />
          </div>

          {/* Input Fields */}
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