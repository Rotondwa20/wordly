/* eslint-disable */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../Firebase/Firebase";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "../../components/NavBar";
import { FiArrowLeft } from "react-icons/fi";
import "../Pagescss/Feed.css"; // reuse Feed styles

const ViewBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch single post by ID
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = doc(db, "posts", id);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          setPost({ id: postSnap.id, ...postSnap.data() });
        } else {
          alert("Post not found");
          navigate("/"); // fallback to feed
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        alert("Error loading post");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  const formatDate = (createdAt) => {
    if (!createdAt) return "Just now";
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : createdAt.toDate();
    return date.toLocaleString();
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "20px" }}>Loading...</p>;

  return (
    <div className="feed-container">
      <Navbar />

      {/* Back Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          maxWidth: "600px",
          margin: "20px auto 0",
          padding: "10px",
        }}
        onClick={() => navigate(-1)}
      >
        <FiArrowLeft size={20} style={{ marginRight: "8px" }} /> Back
      </div>

      {/* Post Content */}
      <div
        style={{
          Width: "600px",
          margin: "10px auto",
          padding: "20px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2>{post.userName || "Unknown User"}</h2>
        {post.title && <h3 className="post-title">{post.title}</h3>}
        <p className="post-text">{post.text}</p>
        {post.image && <img className="post-image" src={post.image} alt="Post" />}
        <small>{formatDate(post.createdAt)}</small>
      </div>

      {/* Optional: Comments Section */}
      {post.commentsArray?.length > 0 && (
        <div style={{ maxWidth: "600px", margin: "20px auto" }}>
          <h3>Comments ({post.commentsArray.length})</h3>
          {post.commentsArray.map((c, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #ddd",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "10px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <strong>{c.userName}</strong>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewBlog;
