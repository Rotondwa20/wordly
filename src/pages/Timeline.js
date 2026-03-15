/* eslint-disable */
import React, { useEffect, useState } from "react";
import { FiHeart, FiMessageCircle, FiShare2 } from "react-icons/fi";
import { db, auth } from "../Firebase/Firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

const UserTimeline = () => {
  const [posts, setPosts] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const postsRef = collection(db, "posts");
    const q = query(postsRef, where("uid", "==", user.uid), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(userPosts);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <p className="text-center mt-10 text-gray-600 font-sans">
        Please log in to see your timeline.
      </p>
    );
  }

  const formatTimestamp = (timestamp) =>
    timestamp ? new Date(timestamp.seconds * 1000).toLocaleString() : "Just now";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center font-sans">
      <h1 className="text-2xl font-bold mt-6">Your Timeline</h1>

      <div className="w-full max-w-2xl p-4 space-y-6">
        {posts.length === 0 ? (
          <p className="text-gray-500">You haven’t posted anything yet.</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-2"
            >
              {/* Post header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold">{user.displayName || "You"}</h2>
                  <p className="text-sm text-gray-500">{formatTimestamp(post.createdAt)}</p>
                </div>
              </div>

              {/* Post content */}
              <h3 className="font-semibold text-lg">{post.title || post.text}</h3>
              {post.description && (
                <p className="text-gray-600 text-sm">{post.description}</p>
              )}

              {post.image && (
                <img
                  src={post.image}
                  alt="Post"
                  className="rounded-lg w-full h-40 object-cover mt-2"
                />
              )}

              {/* Post actions */}
              <div className="flex gap-6 text-gray-500 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <FiHeart /> {post.likes || 0}
                </span>
                <span className="flex items-center gap-1">
                  <FiMessageCircle /> {post.comments || 0}
                </span>
                <span className="flex items-center gap-1">
                  <FiShare2 /> {post.shares || 0}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserTimeline;
