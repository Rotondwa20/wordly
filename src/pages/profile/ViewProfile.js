/* eslint-disable */
import React, { useEffect, useState } from "react";
import { auth, db } from "../../Firebase/Firebase";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { FiHeart, FiMessageCircle, FiShare2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/NavBar";
import "../Pagescss/Profile.css";

const ViewProfile = () => {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            ...data,
            displayName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          });
        } else {
          setUserData({
            displayName: user.displayName || "User",
            email: user.email,
            photoURL: user.photoURL,
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    const fetchUserPosts = async () => {
      try {
        const q = query(collection(db, "posts"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const posts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          commentsArray: doc.data().commentsArray || [],
          likedUsers: doc.data().likedUsers || [],
        }));
        setUserPosts(posts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchUserData();
    fetchUserPosts();
  }, [user]);

  if (!user) return <p className="message">Please log in to view profile.</p>;

  const handleLike = async (post) => {
    if (post.likedUsers.includes(user.uid)) return;
    const postRef = doc(db, "posts", post.id);
    const updatedLikes = (post.likes || 0) + 1;
    const updatedLikedUsers = [...post.likedUsers, user.uid];
    await updateDoc(postRef, { likes: updatedLikes, likedUsers: updatedLikedUsers });

    setUserPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, likes: updatedLikes, likedUsers: updatedLikedUsers } : p
      )
    );
  };

  const handleComment = async (postId, commentText, resetInput) => {
    if (!commentText.trim()) return;
    const postRef = doc(db, "posts", postId);
    const newComment = {
      userId: user.uid,
      userName: userData?.displayName || "User",
      text: commentText,
      likes: 0,
      replies: [],
    };
    await updateDoc(postRef, { commentsArray: arrayUnion(newComment) });

    setUserPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentsArray: [...p.commentsArray, newComment] } : p
      )
    );
    resetInput();
  };

  return (
    <div className="view-profile-container">
      <Navbar />

      {/* Profile Card */}
      <div className="profile-card-wrapper">
        <div className="profile-card">
          {userData?.photoURL ? (
            <img src={userData.photoURL} alt="Profile" className="profile-picture" />
          ) : (
            <div className="profile-picture placeholder">No Image</div>
          )}
          <h1 className="profile-name">{userData?.displayName}</h1>
          <p className="profile-email">{userData?.email}</p>
          {userData?.phoneNumber && <p className="profile-phone">📞 {userData.phoneNumber}</p>}
          <button className="edit-button" onClick={() => navigate("/editprofile")}>Edit Profile</button>
        </div>
      </div>

      {/* Posts */}
      <div className="posts-wrapper">
        <h2>Your Posts</h2>
        {userPosts.length === 0 ? (
          <p className="no-posts">You haven’t posted anything yet.</p>
        ) : (
          userPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              handleLike={handleLike}
              handleComment={handleComment}
              userData={userData}
            />
          ))
        )}
      </div>
    </div>
  );
};

const PostCard = ({ post, handleLike, handleComment, userData }) => {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="post-card">
      {post.title && <h3 className="post-title">{post.title}</h3>}
      {post.text && <p className="post-text">{post.text}</p>}
      {post.image && <img src={post.image} alt="Post" className="post-image" />}

      <div className="post-stats">
        <span onClick={() => handleLike(post)} style={{ cursor: "pointer" }}>
          <FiHeart /> {post.likes || 0}
        </span>
        <span onClick={() => setShowComments(!showComments)} style={{ cursor: "pointer" }}>
          <FiMessageCircle /> {post.commentsArray?.length || 0}
        </span>
        <span>
          <FiShare2 /> {post.shares || 0}
        </span>
      </div>

      {showComments && (
        <div className="post-comments">
          <div className="comment-input">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button onClick={() => handleComment(post.id, commentText, () => setCommentText(""))}>
              Comment
            </button>
          </div>
          {post.commentsArray?.map((c, idx) => (
            <div key={idx} className="comment-item">
              <strong>{c.userName}:</strong> {c.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewProfile;
