/* eslint-disable */
import React, { useState } from "react";
import { db, storage, auth } from "../../Firebase/Firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Navbar from "../../components/NavBar";

const PostPage = () => {
  const [postTitle, setPostTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in to post.");
    if (!postTitle.trim() && !postText.trim() && !image) return;

    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      const userName = userData ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() : user.email;

      let imageUrl = null;
      if (image) {
        const imageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "posts"), {
        title: postTitle,
        text: postText,
        image: imageUrl,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName,
        likes: 0,
        commentsArray: [],
        shares: 0,
      });

      setPostTitle("");
      setPostText("");
      setImage(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error adding post:", error);
      alert("Failed to post. Try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <Navbar />
      <div style={{ maxWidth: "500px", margin: "40px auto", padding: "20px", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#2563eb", fontWeight: "600" }}>Create a Post</h2>
        <form onSubmit={handlePostSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input type="text" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Post title" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
          <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="What's on your mind?" rows={5} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
          <button type="submit" disabled={loading} style={{ padding: "12px", backgroundColor: "#2563eb", color: "#fff", borderRadius: "9999px", fontWeight: "600", cursor: "pointer" }}>
            {loading ? "Posting..." : "Post"}
          </button>
        </form>
        {success && <p style={{ color: "green", marginTop: "10px", textAlign: "center" }}>Post created!</p>}
      </div>
    </div>
  );
};

export default PostPage;
