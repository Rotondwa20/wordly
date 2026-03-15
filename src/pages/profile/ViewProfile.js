/* eslint-disable */
import React, { useEffect, useState } from "react";
import { auth, db } from "../../Firebase/Firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  addDoc,
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { FiHeart, FiMessageCircle, FiShare2 } from "react-icons/fi";
import Navbar from "../../components/NavBar";
import "../Pagescss/ViewProfile.css";

const ViewProfile = () => {
  const { uid } = useParams();
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const user = auth.currentUser;
  const navigate = useNavigate();
  const isMyProfile = !uid || uid === user?.uid;

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const profileId = isMyProfile ? user.uid : uid;

        // Fetch user data
        const docSnap = await getDoc(doc(db, "users", profileId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            ...data,
            displayName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          });

          const followers = data.followers || [];
          const following = data.following || [];
          setFollowersCount(followers.length);
          setFollowingCount(following.length);
          setIsFollowing(followers.includes(user.uid));
        } else {
          setUserData({ displayName: "User Not Found" });
          setFollowersCount(0);
          setFollowingCount(0);
          setIsFollowing(false);
        }

        // Fetch posts
        const postsQuery = query(
          collection(db, "posts"),
          where("userId", "==", profileId)
        );
        const postsSnapshot = await getDocs(postsQuery);
        const posts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          commentsArray: doc.data().commentsArray || [],
          likedUsers: doc.data().likedUsers || [],
        }));
        setUserPosts(posts);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [uid, user, isMyProfile]);

  // Like a post
  const handleLike = async (post) => {
    if (!user || post.likedUsers.includes(user.uid)) return;
    const postRef = doc(db, "posts", post.id);
    const updatedLikes = (post.likes || 0) + 1;
    const updatedLikedUsers = [...post.likedUsers, user.uid];

    await updateDoc(postRef, { likes: updatedLikes, likedUsers: updatedLikedUsers });

    setUserPosts(prev =>
      prev.map(p => p.id === post.id ? { ...p, likes: updatedLikes, likedUsers: updatedLikedUsers } : p)
    );
  };

  // Comment on a post
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

    setUserPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, commentsArray: [...p.commentsArray, newComment] } : p)
    );
    resetInput();
  };

  // Follow user
  const handleFollow = async () => {
    if (!user || isMyProfile || isFollowing) return;
    try {
      const currentUserRef = doc(db, "users", user.uid);
      const profileRef = doc(db, "users", uid);

      await updateDoc(currentUserRef, { following: arrayUnion(uid) });
      await updateDoc(profileRef, { followers: arrayUnion(user.uid) });

      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    } catch (err) {
      console.error("Failed to follow user:", err);
    }
  };

  // Message user
  const handleMessage = async () => {
    if (!user || isMyProfile) return;
    try {
      const privateChatsRef = collection(db, "privateChats");
      const q = query(privateChatsRef, where("members", "array-contains", user.uid));
      const snapshot = await getDocs(q);

      let existingChat = null;
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.members.length === 2 && data.members.includes(uid) && data.members.includes(user.uid)) {
          existingChat = { id: docSnap.id, ...data };
        }
      });

      if (existingChat) navigate(`/PrivateMessages/${existingChat.id}`);
      else {
        const docRef = await addDoc(privateChatsRef, { members: [user.uid, uid], lastMessage: "", lastMessageTime: null, name: null });
        navigate(`/PrivateMessages/${docRef.id}`);
      }
    } catch (err) {
      console.error("Failed to start private chat:", err);
    }
  };

  if (!user) return <p className="message">Please log in to view profiles.</p>;
  if (loading) return <p className="message">Loading profile...</p>;

  return (
    <div className="view-profile-container">
      <Navbar />

      {/* Profile Card */}
      <div className="profile-card-wrapper">
        <div className="profile-card">
          {/* Left: Picture */}
          <div className="profile-picture-container">
            {userData?.photos?.length > 0 ? (
              <img src={userData.photos[0]} alt="Profile" className="profile-picture" />
            ) : (
              <div className="profile-picture placeholder">No Image</div>
            )}
          </div>

          {/* Right: Info */}
          <div className="profile-info">
            <h1 className="profile-name">{userData?.displayName}</h1>
            {userData?.location && <p className="profile-location">📍 {userData.location}</p>}
            {userData?.hobbies && <p className="profile-hobbies">🎨 Hobbies: {userData.hobbies.join(", ")}</p>}
            <p className="profile-followers">👥 Followers: {followersCount} | Following: {followingCount}</p>
            {userData?.bio && <p className="profile-bio">📝 {userData.bio}</p>}

            {isMyProfile ? (
              <button className="edit-button" onClick={() => navigate("/editprofile")}>Edit Profile</button>
            ) : (
              <div className="profile-actions">
                <button className="message-button" onClick={handleMessage}>Message</button>
                <button className={`follow-button ${isFollowing ? "following" : ""}`} onClick={handleFollow}>
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Posts */}
      <div className="posts-wrapper">
        <h2>{isMyProfile ? "Your Posts" : `${userData.displayName}'s Posts`}</h2>
        {userPosts.length === 0 ? <p className="no-posts">No posts to show.</p> :
          userPosts.map(post => (
            <PostCard key={post.id} post={post} handleLike={handleLike} handleComment={handleComment} userData={userData} />
          ))
        }
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
            <input type="text" placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} />
            <button onClick={() => handleComment(post.id, commentText, () => setCommentText(""))}>Comment</button>
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