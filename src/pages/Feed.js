/* eslint-disable */
import React, { useEffect, useState } from "react";
import { FiHeart, FiMessageCircle, FiShare2, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { db } from "../Firebase/Firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import Navbar from "../components/NavBar";

const Feed = () => {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All");

  const user =
    JSON.parse(localStorage.getItem("loggedInUser")) || {
      id: "guest",
      firstName: "Guest",
      lastName: "",
      photoURL: "",
    };

  /* ---------------- FETCH POSTS WITH USER PHOTOS ---------------- */
  const fetchPosts = async () => {
    try {
      const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(postsQuery);

      const postsWithPhotos = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const postData = docSnap.data();
          let userPhoto = "";

          try {
            const userDoc = await getDoc(doc(db, "users", postData.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userPhoto = userData.photos?.[0] || "";
              postData.userName =
                `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || postData.userName;
            }
          } catch (err) {
            console.error("Error fetching post author photo:", err);
          }

          return {
            id: docSnap.id,
            ...postData,
            userPhoto,
            likedUsers: postData.likedUsers || [],
            commentsArray: postData.commentsArray || [],
          };
        })
      );

      setPosts(postsWithPhotos);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    // Fetch posts once on page load
    fetchPosts();
  }, []);

  // Refresh posts only if 30min filter is selected
  useEffect(() => {
    if (timeFilter === "30min") {
      fetchPosts();
    }
  }, [timeFilter]);

  /* ---------------- FILTER POSTS ---------------- */

  const filterPosts = (postsList) => {
    let filtered = [...postsList];

    if (searchText) {
      const text = searchText.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post?.text?.toLowerCase().includes(text) ||
          post?.title?.toLowerCase().includes(text) ||
          post?.userName?.toLowerCase().includes(text)
      );
    }

    if (categoryFilter !== "All") {
      filtered = filtered.filter((post) => post.category === categoryFilter);
    }

    if (timeFilter !== "All") {
      const now = new Date();
      const timeLimits = {
        "30min": 30 * 60 * 1000,
        "1hr": 60 * 60 * 1000,
        "5hr": 5 * 60 * 60 * 1000,
        "1day": 24 * 60 * 60 * 1000,
        "2day": 48 * 60 * 60 * 1000,
      };
      const limit = timeLimits[timeFilter];

      filtered = filtered.filter((post) => {
        const created = post?.createdAt?.seconds
          ? new Date(post.createdAt.seconds * 1000)
          : post?.createdAt?.toDate?.();
        return created && now - created <= limit;
      });
    }

    const now = new Date();
    const recentPosts = filtered.filter((post) => {
      const created = post?.createdAt?.seconds
        ? new Date(post.createdAt.seconds * 1000)
        : post?.createdAt?.toDate?.();
      return created && now - created <= 5 * 60 * 1000;
    });

    const otherPosts = filtered.filter((post) => !recentPosts.includes(post));
    otherPosts.sort(() => Math.random() - 0.5);

    return [...recentPosts, ...otherPosts];
  };

  const displayedPosts = filterPosts(posts).slice(0, visibleCount);
  const showMorePosts = () => setVisibleCount((prev) => prev + 10);

  /* ---------------- UI ---------------- */

  return (
    <div style={{ position: "relative", minHeight: "100vh", paddingBottom: "80px" }}>
      <Navbar onSearch={setSearchText} />

      {/* Filters */}
      <div
        style={{
          padding: "16px",
          display: "flex",
          gap: "12px",
          marginLeft: "42rem",
          borderRadius: "8px",
          backgroundColor: "#fff",
        }}
      >
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: "4px 8px", border: "1px solid #2563eb", borderRadius: "6px" }}
        >
          <option value="All">All Categories</option>
          <option value="Tech">Tech</option>
          <option value="Lifestyle">Lifestyle</option>
          <option value="News">News</option>
          <option value="Entertainment">Entertainment</option>
        </select>

        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          style={{ padding: "4px 8px", border: "1px solid #2563eb", borderRadius: "6px" }}
        >
          <option value="All">All Time</option>
          <option value="30min">Last 30 min</option>
          <option value="1hr">Last 1 hr</option>
          <option value="5hr">Last 5 hr</option>
          <option value="1day">Last 1 day</option>
          <option value="2day">Last 2 days</option>
        </select>
      </div>

      {/* Posts */}
      <div style={{ padding: "16px", width:"80%", margin:"auto" }}>
        {displayedPosts.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No posts found!</p>
        ) : (
          displayedPosts.map((post) => <PostItem key={post.id} post={post} user={user} navigate={navigate} />)
        )}

        {visibleCount < filterPosts(posts).length && (
          <button
            onClick={showMorePosts}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Show More
          </button>
        )}
      </div>

      {/* Floating Button */}
      <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 50 }}>
        <button
          onClick={() => navigate("/writeblog")}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "#2563eb",
            border: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            cursor: "pointer",
          }}
        >
          <FiPlus size={24} color="#fff" />
        </button>
      </div>
    </div>
  );
};

/* ---------------- POST ITEM ---------------- */

const PostItem = ({ post, user, navigate }) => {
  const [postState, setPostState] = useState(post);
  const [showMore, setShowMore] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const maxLength = 150;
  const isLiked = postState.likedUsers.includes(user.id);

  const displayedText =
    !postState.text
      ? ""
      : postState.text.length <= maxLength
      ? postState.text
      : showMore
      ? postState.text
      : postState.text.slice(0, maxLength) + "...";

  const handleLike = async () => {
    const postRef = doc(db, "posts", postState.id);
    let likedUsers = postState.likedUsers || [];
    let newLikes = postState.likes || 0;

    if (isLiked) {
      likedUsers = likedUsers.filter((id) => id !== user.id);
      newLikes--;
    } else {
      likedUsers.push(user.id);
      newLikes++;

      if (postState.userId !== user.id) {
        await addDoc(collection(db, "notifications"), {
          receiverId: postState.userId,
          senderName: `${user.firstName} ${user.lastName}`,
          postId: postState.id,
          type: "like",
          read: false,
          timestamp: serverTimestamp(),
        });
      }
    }

    await updateDoc(postRef, { likes: newLikes, likedUsers });
    setPostState({ ...postState, likes: newLikes, likedUsers });
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const postRef = doc(db, "posts", postState.id);
    const newComment = {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      text: commentText,
      likes: 0,
      replies: [],
    };

    await updateDoc(postRef, { commentsArray: arrayUnion(newComment) });
    setPostState({ ...postState, commentsArray: [...(postState.commentsArray || []), newComment] });
    setCommentText("");
  };

  const formatDate = (createdAt) => {
    if (!createdAt) return "Just now";
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : createdAt.toDate();
    return date.toLocaleString();
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "16px", padding: "12px" }}>
      {/* Profile Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {postState.userPhoto ? (
          <img src={postState.userPhoto} alt="Profile" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
            {postState.userName ? postState.userName.charAt(0) : "U"}
          </div>
        )}

        <div>
          <h3 style={{ margin: 0 }}>{postState.userName || "Unknown User"}</h3>
          <p style={{ margin: 0, fontSize: "0.7rem", color: "#555" }}>{formatDate(postState.createdAt)}</p>
        </div>
      </div>

      {/* Title */}
      {postState.title && (
        <h4 style={{ cursor: "pointer", marginTop: "8px" }} onClick={() => navigate(`/viewblog/${postState.id}`, { state: { post: postState } })}>
          {postState.title}
        </h4>
      )}

      {/* Text */}
      
      <p style={{ cursor: "pointer" }} onClick={() => navigate(`/viewblog/${postState.id}`, { state: { post: postState } })}>
        {displayedText}
        {postState.text?.length > maxLength && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setShowMore(!showMore);
            }}
            style={{ color: "#2563eb", marginLeft: "5px" }}
          >
            {showMore ? "See Less" : "See More"}
          </span>
        )}
      </p>

      {/* Post Image */}
      {postState.image && <img src={postState.image} alt="Post" style={{ width: "100%", borderRadius: "8px", marginTop: "8px", cursor: "pointer" }} onClick={() => navigate(`/viewblog/${postState.id}`, { state: { post: postState } })} />}

      {/* Actions */}
      <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
        <span onClick={handleLike} style={{ cursor: "pointer" }}>
          <FiHeart color={isLiked ? "red" : "black"} /> {postState.likes || 0}
        </span>
        <span onClick={() => setShowComments(!showComments)} style={{ cursor: "pointer" }}>
          <FiMessageCircle /> {postState.commentsArray?.length || 0}
        </span>
        <span>
          <FiShare2 /> {postState.shares || 0}
        </span>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ marginTop: "8px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ flex: 1, padding: "4px 8px", borderRadius: "6px", border: "1px solid #d1d5db" }} />
            <button onClick={handleComment} style={{ padding: "4px 12px", borderRadius: "6px", backgroundColor: "#2563eb", color: "#fff", border: "none" }}>
              Comment
            </button>
          </div>
          {postState.commentsArray?.map((c, idx) => <CommentItem key={idx} comment={c} />)}
        </div>
      )}
    </div>
  );
};

/* ---------------- COMMENT ITEM ---------------- */

const CommentItem = ({ comment }) => (
  <div style={{ marginBottom: "8px", paddingLeft: "16px" }}>
    <p style={{ margin: 0 }}>
      <strong>{comment.userName}:</strong> {comment.text} <FiHeart style={{ cursor: "pointer" }} /> {comment.likes || 0}
    </p>
    {comment.replies?.map((reply, i) => (
      <div key={i} style={{ paddingLeft: "16px", marginTop: "4px" }}>
        <p style={{ margin: 0 }}>
          <strong>{reply.userName}:</strong> {reply.text}
        </p>
      </div>
    ))}
  </div>
);

export default Feed;