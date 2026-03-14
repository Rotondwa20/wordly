/* eslint-disable */

import React, { useState } from "react";
import { FiHeart, FiMessageCircle, FiShare2 } from "react-icons/fi";

import { db } from "../Firebase/Firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import CommentItem from "./CommentItem";

const PostItem = ({ post, user, navigate }) => {
  const [postState, setPostState] = useState(post);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const isLiked = postState.likedUsers?.includes(user.id);

  /* LIKE */

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

      await addDoc(collection(db, "notifications"), {
        receiverId: postState.userId,
        senderName: `${user.firstName} ${user.lastName}`,
        type: "like",
        postId: postState.id,
        read: false,
        timestamp: serverTimestamp(),
      });
    }

    await updateDoc(postRef, { likes: newLikes, likedUsers });

    setPostState({ ...postState, likes: newLikes, likedUsers });
  };

  /* COMMENT */

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

    await updateDoc(postRef, {
      commentsArray: arrayUnion(newComment),
    });

    setPostState({
      ...postState,
      commentsArray: [...(postState.commentsArray || []), newComment],
    });

    setCommentText("");
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
      
      <h3>{postState.userName}</h3>

      {postState.title && (
        <h4 onClick={() => navigate(`/viewblog/${postState.id}`, { state: { post: postState } })}>
          {postState.title}
        </h4>
      )}

      {postState.text && <p>{postState.text}</p>}

      {postState.image && (
        <img
          src={postState.image}
          alt="post"
          style={{ width: "100%", borderRadius: "8px" }}
        />
      )}

      {/* ACTIONS */}

      <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
        <span onClick={handleLike}>
          <FiHeart color={isLiked ? "red" : "black"} /> {postState.likes || 0}
        </span>

        <span onClick={() => setShowComments(!showComments)}>
          <FiMessageCircle /> {postState.commentsArray?.length || 0}
        </span>

        <span>
          <FiShare2 />
        </span>
      </div>

      {/* COMMENTS */}

      {showComments && (
        <div style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder="Write comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />

          <button onClick={handleComment}>Comment</button>

          {postState.commentsArray?.map((c, i) => (
            <CommentItem key={i} comment={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostItem;