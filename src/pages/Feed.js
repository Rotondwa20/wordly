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
import "./Pagescss/Feed.css";

const Feed = () => {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [timeFilter, setTimeFilter] = useState("All");

  const user =
    JSON.parse(localStorage.getItem("loggedInUser")) || {
      id: "guest",
      firstName: "Guest",
      lastName: "",
      photoURL: "",
    };

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
                `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
            }
          } catch (err) {
            console.log("Error fetching user photo");
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
    fetchPosts();
  }, []);

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

    return filtered;
  };

  const displayedPosts = filterPosts(posts).slice(0, visibleCount);
  const showMorePosts = () => setVisibleCount((prev) => prev + 10);

  return (
    <div className="feed-page">
      <Navbar onSearch={setSearchText} />
      <div className="feed-header">
  <h2>🔥 Stay Updated! Explore the Latest Buzz from Everyone 🔥</h2>
  <p>Check out trending posts, hottest stories, and what your friends are talking about!</p>
</div>

      {/* TIME FILTER */}
      <div className="feed-filters">
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="feed-select"
        >
          <option value="All">All Time</option>
          <option value="30min">Last 30 min</option>
          <option value="1hr">Last 1 hr</option>
          <option value="5hr">Last 5 hr</option>
          <option value="1day">Last 1 day</option>
          <option value="2day">Last 2 days</option>
        </select>
      </div>

      <div className="feed-posts">
        {displayedPosts.length === 0 ? (
          <p className="no-posts">No posts found</p>
        ) : (
          displayedPosts.map((post) => (
            <PostItem key={post.id} post={post} user={user} navigate={navigate} />
          ))
        )}

        {visibleCount < filterPosts(posts).length && (
          <button className="feed-show-more" onClick={showMorePosts}>
            Show More
          </button>
        )}
      </div>

      <div className="feed-float-btn">
        <button onClick={() => navigate("/writeblog")} className="float-btn">
          <FiPlus size={24} />
        </button>
      </div>
    </div>
  );
};

/* ---------------- POST ITEM ---------------- */
const PostItem = ({ post, user, navigate }) => {
  const [postState, setPostState] = useState(post);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showMoreText, setShowMoreText] = useState(false);

  const isLiked = postState.likedUsers.includes(user.id);
  const maxLength = 1400;
  const displayedText =
    !postState.text
      ? ""
      : postState.text.length <= maxLength
      ? postState.text
      : showMoreText
      ? postState.text
      : postState.text.slice(0, maxLength) + "...";

  const handleLike = async () => {
    const postRef = doc(db, "posts", postState.id);
    let likedUsers = [...postState.likedUsers];
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
    };
    await updateDoc(postRef, { commentsArray: arrayUnion(newComment) });
    setPostState({
      ...postState,
      commentsArray: [...postState.commentsArray, newComment],
    });
    setCommentText("");
  };

  const formatDate = (createdAt) => {
    if (!createdAt) return "";
    const date = createdAt.seconds
      ? new Date(createdAt.seconds * 1000)
      : createdAt.toDate();
    return date.toLocaleString();
  };

  return (
    <div className="post-item">
      {/* PROFILE */}
      <div
        className="post-header"
        onClick={() => navigate(`/viewprofile/${postState.userId}`)}
      >
        {postState.userPhoto ? (
          <img src={postState.userPhoto} alt="Profile" className="post-avatar" />
        ) : (
          <div className="post-avatar-placeholder">
            {postState.userName?.charAt(0)}
          </div>
        )}
        <h3 className="post-username">{postState.userName}</h3>
        <p className="post-date">{formatDate(postState.createdAt)}</p>
      </div>

      {/* IMAGE */}
      {postState.image && (
        <img
          src={postState.image}
          alt="Post"
          className="post-image"
          onClick={() =>
            navigate(`/viewblog/${postState.id}`, { state: { post: postState } })
          }
        />
      )}

      {/* TITLE */}
      {postState.title && (
        <h4
          className="post-title"
          onClick={() =>
            navigate(`/viewblog/${postState.id}`, { state: { post: postState } })
          }
        >
          {postState.title}
        </h4>
      )}

      {/* TEXT */}
      <p
        className="post-text"
        onClick={() =>
          navigate(`/viewblog/${postState.id}`, { state: { post: postState } })
        }
      >
        {displayedText}
        {postState.text?.length > maxLength && (
          <span
            className="see-more"
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreText(!showMoreText);
            }}
          >
            {showMoreText ? "See Less" : "See More"}
          </span>
        )}
      </p>

      {/* ACTIONS */}
      <div className="post-actions">
        <span onClick={handleLike}>
          <FiHeart color={isLiked ? "red" : "black"} /> {postState.likes || 0}
        </span>
        <span onClick={() => setShowComments(!showComments)}>
          <FiMessageCircle /> {postState.commentsArray?.length || 0}
        </span>
        <span>
          <FiShare2 /> {postState.shares || 0}
        </span>
      </div>

      {/* COMMENTS */}
      {showComments && (
        <div className="post-comments">
          <div className="comment-input-container">
            <input
              type="text"
              placeholder="Write a comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button onClick={handleComment}>Post</button>
          </div>
          {postState.commentsArray?.map((c, i) => (
            <div key={i} className="comment-item">
              <strong>{c.userName}</strong> {c.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;