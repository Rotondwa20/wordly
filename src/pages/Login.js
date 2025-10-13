/* eslint-disable */
import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../Firebase/Firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import "./Pagescss/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save logged-in user to localStorage
  const saveUserToLocal = (user, firstName = "Guest", lastName = "") => {
    const loggedInUser = {
      id: user.uid,
      email: user.email,
      firstName,
      lastName,
    };
    localStorage.setItem("loggedInUser", JSON.stringify(loggedInUser));
  };

  // Login with email/password
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Fetch firstName & lastName from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const firstName = userData.firstName || "Guest";
      const lastName = userData.lastName || "";

      saveUserToLocal(user, firstName, lastName);

      setMessage({ type: "success", text: "Login successful! 🎉" });
      setTimeout(() => navigate("/Feed"), 1500);
    } catch (error) {
      console.log(error);
      setMessage({ type: "error", text: "Invalid email or password." });
    }
  };

  // Login with Google
  const handleGoogleLogin = async () => {
    setMessage({ type: "", text: "" });

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      let firstName = "Guest";
      let lastName = "";

      if (user.displayName) {
        const parts = user.displayName.split(" ");
        firstName = parts[0];
        lastName = parts.slice(1).join(" ");
      }

      saveUserToLocal(user, firstName, lastName);
      setMessage({ type: "success", text: "Logged in with Google! 🎉" });
      setTimeout(() => navigate("/Feed"), 1500);
    } catch (error) {
      console.log(error);
      setMessage({ type: "error", text: "Google login failed. Try again." });
    }
  };

  return (
    <div className="background">
      <nav className="navbar">
        <h1 className="nav-logo" onClick={() => navigate("/")}>Wordly</h1>
        <div className="nav-links">
          <span onClick={() => navigate("/")}>Home</span>
          <span onClick={() => navigate("/about")}>About</span>
          <span onClick={() => navigate("/register")}>Register</span>
        </div>
      </nav>

      <div className="login-container">
        <h2 className="login-title">Welcome Back to Wordly</h2>

        {message.text && (
          <p className={message.type === "error" ? "error" : "success"}>
            {message.text}
          </p>
        )}

        <form onSubmit={handleEmailLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="login-btn">Login</button>
        </form>

        <div className="divider">OR</div>

        <button onClick={handleGoogleLogin} className="google-btn">
          Sign in with Google
        </button>

        <p className="signup-link">
          Don’t have an account?{" "}
          <span onClick={() => navigate("/register")}>Register here</span>
        </p>
      </div>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Wordly App | Designed with ❤️ by Rotondwa Rambau</p>
      </footer>
    </div>
  );
};

export default Login;
