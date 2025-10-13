import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import About from "./pages/About";
import Community from "./pages/Community";
import ViewProfile from "./pages/profile/ViewProfile";
import EditProfile from "./pages/profile/EditProfile";
import WritableStreamBlog from "./pages/blog/WriteBlog";
import ViewBlog from "./pages/blog/ViewBlog";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import ChatsList from "./pages/ChatsList";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/viewprofile" element={<ViewProfile />} />
        <Route path="/editprofile" element={<EditProfile />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/ChatsList" element={<ChatsList />} />
        <Route path="/notifications" element={<Notifications />} /> 
        <Route path="/about" element={<About />} />
        <Route path="/community" element={<Community />} />
        <Route path="/Messages/:id" element={<Messages />} />

        <Route path="/writeblog" element={<WritableStreamBlog />} />
        <Route path="/viewblog/:id" element={<ViewBlog />} />
      </Routes>
    </Router>
  );
}

export default App;
