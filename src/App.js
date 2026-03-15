import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Community from "./pages/Community";
import ViewProfile from "./pages/profile/ViewProfile";
import EditProfile from "./pages/profile/EditProfile";
import WritableStreamBlog from "./pages/blog/WriteBlog";
import ViewBlog from "./pages/blog/ViewBlog";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import ChatsList from "./pages/ChatsList";
import Timeline from "./pages/Timeline";
import PrivateMessages from "./pages/PrivateMessages";
import Bloggers from "./pages/Bloggers";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/viewprofile" element={<ViewProfile />} />
        <Route path="/editprofile" element={<EditProfile />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/ChatsList" element={<ChatsList />} />
        <Route path="/notifications" element={<Notifications />} /> 
        <Route path="/community" element={<Community />} />
        <Route path="/Messages/:id" element={<Messages />} />
        <Route path="/Timeline" element={<Timeline />} />
        <Route path="/bloggers" element={<Bloggers />} />
        

        <Route path="/writeblog" element={<WritableStreamBlog />} />
        <Route path="/viewblog/:id" element={<ViewBlog />} />
                <Route path="/ViewProfile/:uid" element={<ViewProfile />} />
                        <Route path="/PrivateMessages/:id" element={<PrivateMessages />} />
        {/* Add more routes as needed */}

      </Routes>
    </Router>
  );
}

export default App;
