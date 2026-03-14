import React from "react";

const CommentItem = ({ comment }) => {
  return (
    <div style={{ paddingLeft: "12px", marginTop: "6px" }}>
      <strong>{comment.userName}</strong>: {comment.text}

      {comment.replies?.map((reply, i) => (
        <div key={i} style={{ paddingLeft: "14px" }}>
          <strong>{reply.userName}</strong>: {reply.text}
        </div>
      ))}
    </div>
  );
};

export default CommentItem;