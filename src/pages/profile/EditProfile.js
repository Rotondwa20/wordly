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
  const [photos, setPhotos] = useState([]);
  const [location, setLocation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [hobbies, setHobbies] = useState([]);
  const [interests, setInterests] = useState([]);
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Fetch current user data
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
          setLocation(data.location || "");
          setOccupation(data.occupation || "");
          setHobbies(data.hobbies || []);
          setInterests(data.interests || []);
          setBio(data.bio || "");
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
        location,
        occupation,
        hobbies,
        interests,
        bio,
      });

      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
    setLoading(false);
  };

  // Handle photo upload
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

        if (width > height && width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        } else if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let base64String = canvas.toDataURL("image/jpeg", 0.7);

        while (base64String.length / 1024 > 1024) {
          base64String = canvas.toDataURL("image/jpeg", 0.6);
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

          {/* Basic Info */}
          <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />

          {/* Additional Info */}
          <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <input type="text" placeholder="Occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
          <input type="text" placeholder="Hobbies (comma separated)" value={hobbies.join(", ")} 
                 onChange={(e) => setHobbies(e.target.value.split(",").map(h => h.trim()))} />
          <input type="text" placeholder="Interests (comma separated)" value={interests.join(", ")} 
                 onChange={(e) => setInterests(e.target.value.split(",").map(i => i.trim()))} />
          <textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />

          <button type="submit" disabled={loading} className="editprofile-btn">
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;