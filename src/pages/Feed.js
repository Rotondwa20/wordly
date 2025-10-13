/* eslint-disable */
import React, { useEffect, useState } from "react";
import { FiHeart, FiMessageCircle, FiShare2 } from "react-icons/fi";
import { db } from "../Firebase/Firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import "./Pagescss/Feed.css";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {
    id: "guest",
    firstName: "Guest",
    lastName: "",
  };

  // Fetch posts from Firestore
  useEffect(() => {
    const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(postsQuery, snapshot => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter(
    post =>
      post.text?.toLowerCase().includes(searchText.toLowerCase()) ||
      post.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="feed-container">
      <Navbar />

      {/* Post Input */}
      <div className="feed-post-input">
        <input
          type="text"
          placeholder="What's on your mind?"
          value={postText}
          onChange={e => setPostText(e.target.value)}
        />
        <button
          onClick={() => {
            if (postText.trim()) navigate("/writeblog", { state: { text: postText } });
          }}
        >
          Post
        </button>
      </div>

      {/* Posts */}
      <div className="feed-posts">
        {filteredPosts.length === 0 ? (
          <p className="text-gray-500">No posts found!</p>
        ) : (
          filteredPosts.map(post => (
            <PostItem key={post.id} post={post} user={user} navigate={navigate} />
          ))
        )}
      </div>
    </div>
  );
};

// Post Component
const PostItem = ({ post, user, navigate }) => {
  const [showMore, setShowMore] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postState, setPostState] = useState(post);

  const maxLength = 150;
  const isLong = postState.text?.length > maxLength;
  const displayedText = !isLong ? postState.text : showMore ? postState.text : postState.text.slice(0, maxLength) + "...";

  const formatDate = createdAt => {
    if (!createdAt) return "Just now";
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : createdAt.toDate();
    return date.toLocaleString();
  };

  // Navigate to ViewBlog
  const goToViewBlog = () => {
    navigate(`/viewblog/${postState.id}`, { state: { post: postState } });
  };

  // Like + Notification
  const handleLike = async () => {
    const postRef = doc(db, "posts", postState.id);
    const likedUsers = postState.likedUsers || [];

    if (!likedUsers.includes(user.id)) {
      likedUsers.push(user.id);
      await updateDoc(postRef, { likes: (postState.likes || 0) + 1, likedUsers });
      setPostState({ ...postState, likes: (postState.likes || 0) + 1, likedUsers });

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
  };

  // Comment + Notification
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
    setPostState({
      ...postState,
      commentsArray: [...(postState.commentsArray || []), newComment],
    });
    setCommentText("");

    if (postState.userId !== user.id) {
      await addDoc(collection(db, "notifications"), {
        receiverId: postState.userId,
        senderName: `${user.firstName} ${user.lastName}`,
        postId: postState.id,
        type: "comment",
        read: false,
        timestamp: serverTimestamp(),
      });
    }
  };

  return (
    <div className="feed-post">
      <div className="post-header">
        <h2>{postState.userName || "Unknown User"}</h2>
        <p>{formatDate(postState.createdAt)}</p>
      </div>

      {postState.title && (
        <h3 className="post-title" onClick={goToViewBlog} style={{ cursor: "pointer" }}>
          {postState.title}
        </h3>
      )}

      <h3 className="post-text" onClick={goToViewBlog} style={{ cursor: "pointer" }}>
        {displayedText}
        {isLong && (
          <span
            onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
            style={{ color: "#2563eb", cursor: "pointer", marginLeft: "5px" }}
          >
            {showMore ? "See Less" : "See More"}
          </span>
        )}
      </h3>

      {postState.image && <img className="post-image" src={postState.image} alt="Post" onClick={goToViewBlog} style={{ cursor: "pointer" }} />}

      <div className="feed-post-footer">
        <span onClick={handleLike}>
          <FiHeart /> {postState.likes || 0}
        </span>
        <span onClick={() => setShowComments(!showComments)}>
          <FiMessageCircle /> {postState.commentsArray?.length || 0}
        </span>
        <span>
          <FiShare2 /> {postState.shares || 0}
        </span>
      </div>

      {showComments && (
        <div className="feed-comment-section">
          <div className="feed-comment-input">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
            />
            <button onClick={handleComment}>Comment</button>
          </div>

          {postState.commentsArray?.map((comment, idx) => (
            <CommentItem key={idx} comment={comment} index={idx} handleReply={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
};

// Comment Component
const CommentItem = ({ comment, index, handleReply }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  return (
    <div className="feed-comment">
      <p>
        <strong>{comment.userName}:</strong> {comment.text} <FiHeart style={{ cursor: "pointer" }} /> {comment.likes || 0}
      </p>

      {comment.replies?.map((r, i) => (
        <div key={i} className="feed-reply">
          <p>
            <strong>{r.userName}:</strong> {r.text}
          </p>
        </div>
      ))}

      {showReply && (
        <div className="feed-comment-input">
          <input
            type="text"
            placeholder={`Reply to ${comment.userName}`}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
          />
          <button
            onClick={() => {
              handleReply(index, replyText);
              setReplyText("");
              setShowReply(false);
            }}
          >
            Reply
          </button>
        </div>
      )}

      <button className="feed-reply-btn" onClick={() => setShowReply(!showReply)}>
        {showReply ? "Cancel" : "Reply"}
      </button>
    </div>
  );
};

export default Feed;
