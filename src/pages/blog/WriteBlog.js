/* eslint-disable */
import React, { useState, useRef } from "react";
import { db, auth } from "../../Firebase/Firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import Navbar from "../../components/NavBar";

const PostPage = () => {
  const [postTitle, setPostTitle] = useState("");
  const [image, setImage] = useState(null); // Base64 image
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const editorRef = useRef(null);

  const handleFormat = (command) => {
    document.execCommand(command, false, null);
  };

  // Convert image to Base64 like EditProfile
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadstart = () => setImageLoading(true);

    reader.onloadend = () => {
      let img = new Image();
      img.src = reader.result;

      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        let width = img.width;
        let height = img.height;

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

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let base64String = canvas.toDataURL("image/jpeg", 0.7);

        // Reduce if larger than 1MB
        while (base64String.length / 1024 > 1024) {
          base64String = canvas.toDataURL("image/jpeg", 0.6);
        }

        setImage(base64String);
        setImageLoading(false);
      };
    };

    reader.readAsDataURL(file);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("You must be logged in.");

    const postText = editorRef.current.innerHTML;

    if (!postTitle.trim() && !postText.trim() && !image) {
      alert("Post cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      const userName = userData
        ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
        : user.email;

      const userPhoto =
        userData?.photos && userData.photos.length > 0
          ? userData.photos[0]
          : "";

      await addDoc(collection(db, "posts"), {
        title: postTitle,
        text: postText,
        image: image || null,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: userName,
        userPhoto: userPhoto,
        likes: [],
        commentsArray: [],
        shares: 0,
      });

      setPostTitle("");
      setImage(null);
      editorRef.current.innerHTML = "";

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post.");
    }

    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />

      <div
        style={{
         Width: "600px",
          margin: "40px auto",
          padding: "20px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#2563eb" }}>
          Create Post
        </h2>

        <form
          onSubmit={handlePostSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <input
            type="text"
            placeholder="Post title"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />

          {/* Toolbar */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={() => handleFormat("bold")}>
              <b>B</b>
            </button>

            <button type="button" onClick={() => handleFormat("italic")}>
              <i>I</i>
            </button>

            <button type="button" onClick={() => handleFormat("underline")}>
              <u>U</u>
            </button>

            <button type="button" onClick={() => handleFormat("insertUnorderedList")}>
              • List
            </button>

            <button type="button" onClick={() => handleFormat("insertOrderedList")}>
              1. List
            </button>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            style={{
              minHeight: "120px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
            }}
          ></div>

          {/* Image Upload */}
          <input type="file" accept="image/*" onChange={handleImageUpload} />

          {imageLoading && <p>Processing image...</p>}

          {image && (
            <img
              src={image}
              alt="preview"
              style={{
                width: "100%",
                borderRadius: "10px",
                marginTop: "10px",
              }}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              background: "#2563eb",
              color: "#fff",
              borderRadius: "9999px",
              border: "none",
            }}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </form>

        {success && (
          <p style={{ color: "green", textAlign: "center" }}>
            Post created successfully!
          </p>
        )}
      </div>
    </div>
  );
};

export default PostPage;