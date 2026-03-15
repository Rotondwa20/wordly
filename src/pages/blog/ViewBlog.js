/* eslint-disable */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiHeart, FiMessageCircle, FiShare2 } from "react-icons/fi";
import { db } from "../../Firebase/Firebase";
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, addDoc } from "firebase/firestore";
import Navbar from "../../components/NavBar";
import "../Pagescss/Feed.css"; // reuse Feed styles

const ViewBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: "guest",
    firstName: "Guest",
    lastName: "",
    photoURL: "",
  };

  // Fetch single post by ID
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = doc(db, "posts", id);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const postData = postSnap.data();
          // fetch user photo
          try {
            const userDoc = await getDoc(doc(db, "users", postData.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              postData.userPhoto = userData.photos?.[0] || "";
              postData.userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || postData.userName;
            }
          } catch (err) {
            console.error("Error fetching post author photo:", err);
          }

          setPost({ id: postSnap.id, ...postData, likedUsers: postData.likedUsers || [], commentsArray: postData.commentsArray || [] });
        } else {
          alert("Post not found");
          navigate("/"); // fallback
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

  const handleLike = async () => {
    if (!post) return;
    const postRef = doc(db, "posts", post.id);
    let likedUsers = post.likedUsers || [];
    let newLikes = post.likes || 0;

    const isLiked = likedUsers.includes(user.id);

    if (isLiked) {
      likedUsers = likedUsers.filter((id) => id !== user.id);
      newLikes--;
    } else {
      likedUsers.push(user.id);
      newLikes++;

      if (post.userId !== user.id) {
        await addDoc(collection(db, "notifications"), {
          receiverId: post.userId,
          senderName: `${user.firstName} ${user.lastName}`,
          postId: post.id,
          type: "like",
          read: false,
          timestamp: serverTimestamp(),
        });
      }
    }

    await updateDoc(postRef, { likes: newLikes, likedUsers });
    setPost({ ...post, likes: newLikes, likedUsers });
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const postRef = doc(db, "posts", post.id);
    const newComment = {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      text: commentText,
      likes: 0,
      replies: [],
    };
    await updateDoc(postRef, { commentsArray: arrayUnion(newComment) });
    setPost({ ...post, commentsArray: [...(post.commentsArray || []), newComment] });
    setCommentText("");
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "20px" }}>Loading...</p>;

  return (
    <div className="feed-container">
      <Navbar />

      {/* Back Button */}
      <div
        style={{ display: "flex", alignItems: "center", cursor: "pointer", maxWidth: "600px", margin: "20px auto", padding: "10px" }}
        onClick={() => navigate(-1)}
      >
        <FiArrowLeft size={20} style={{ marginRight: "8px" }} /> Back
      </div>

      {post && (
        <div style={{ maxWidth: "75%", margin: "10px auto", padding: "20px", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {/* Profile Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            {post.userPhoto ? (
              <img src={post.userPhoto} alt="Profile" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                {post.userName ? post.userName.charAt(0) : "U"}
              </div>
            )}
            <div>
              <h3 style={{ margin: 0 }}>{post.userName || "Unknown User"}</h3>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "#555" }}>{formatDate(post.createdAt)}</p>
            </div>
          </div>

          {/* Title & Text */}
          {post.title && <h2>{post.title}</h2>}
          <p>{post.text}</p>

          {/* Post Image */}
          {post.image && <img src={post.image} alt="Post" style={{ width: "100%", borderRadius: "8px", marginTop: "8px" }} />}

          {/* Actions */}
          <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
            <span onClick={handleLike} style={{ cursor: "pointer" }}>
              <FiHeart color={post.likedUsers.includes(user.id) ? "red" : "black"} /> {post.likes || 0}
            </span>
            <span onClick={() => setShowComments(!showComments)} style={{ cursor: "pointer" }}>
              <FiMessageCircle /> {post.commentsArray?.length || 0}
            </span>
            <span>
              <FiShare2 /> {post.shares || 0}
            </span>
          </div>

          {/* Comments */}
          {showComments && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ flex: 1, padding: "4px 8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                />
                <button onClick={handleComment} style={{ padding: "4px 12px", borderRadius: "6px", backgroundColor: "#2563eb", color: "#fff", border: "none" }}>
                  Comment
                </button>
              </div>

              {post.commentsArray?.map((c, idx) => (
                <div key={idx} style={{ marginBottom: "8px", paddingLeft: "16px" }}>
                  <p style={{ margin: 0 }}>
                    <strong>{c.userName}:</strong> {c.text} <FiHeart style={{ cursor: "pointer" }} /> {c.likes || 0}
                  </p>
                  {c.replies?.map((r, i) => (
                    <div key={i} style={{ paddingLeft: "16px", marginTop: "4px" }}>
                      <p style={{ margin: 0 }}>
                        <strong>{r.userName}:</strong> {r.text}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewBlog;