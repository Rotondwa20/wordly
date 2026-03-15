/* eslint-disable */
import React, { useState } from "react";
import { auth, googleProvider, db } from "../Firebase/Firebase";
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "./Pagescss/Login.css";

const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    dob: "",
    phoneNumber: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify({ id: user.uid, email: user.email, firstName: userData.firstName || "Guest", lastName: userData.lastName || "" })
      );
      setMessage({ type: "success", text: "Login successful! 🎉" });
      setTimeout(() => window.location.reload(), 1500); // redirect to Feed
    } catch (error) {
      setMessage({ type: "error", text: "Invalid email or password." });
    }
  };

  const handleGoogleLogin = async () => {
    setMessage({ type: "", text: "" });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const nameParts = user.displayName ? user.displayName.split(" ") : ["Guest"];
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify({ id: user.uid, email: user.email, firstName: nameParts[0], lastName: nameParts.slice(1).join(" ") })
      );
      setMessage({ type: "success", text: "Logged in with Google! 🎉" });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setMessage({ type: "error", text: "Google login failed. Try again." });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!formData.firstName || !formData.lastName || !formData.dob || !formData.phoneNumber || !formData.email || !formData.password || !formData.confirmPassword) {
      setMessage({ type: "error", text: "All fields are required." });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        createdAt: new Date().toISOString(),
      });
      setMessage({ type: "success", text: "Registration successful! You can now login." });
      setIsRegister(false);
      setFormData({ email: "", password: "", firstName: "", lastName: "", dob: "", phoneNumber: "", confirmPassword: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  return (
    <div className="landing-background">
      <div className="landing-container">
        {/* LEFT SIDE */}
        <div className="landing-left">
          <div className="landing-logo">
            <div className="logo-icon">W</div>
            <h1 className="logo-text">WORDLY</h1>
          </div>
          <h2>Welcome to Wordly</h2>
          <p>{isRegister ? "Create your account and start sharing amazing blogs!" : "Discover, share, and connect with amazing blogs from all around the world."}</p>
          <img
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c"
            alt="Blogging Illustration"
            className="landing-image"
          />
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="landing-right">
          <h2 className="login-title">{isRegister ? "Create Your Account" : "Login to Your Account"}</h2>
          {message.text && <p className={message.type === "error" ? "error" : "success"}>{message.text}</p>}

          {isRegister ? (
            <form onSubmit={handleRegister} className="login-form">
              <div className="form-group"><label>First Name</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} /></div>
              <div className="form-group"><label>Last Name</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} /></div>
              <div className="form-group"><label>Date Of Birth</label><input type="date" name="dob" value={formData.dob} onChange={handleChange} /></div>
              <div className="form-group"><label>Phone Number</label><input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} /></div>
              <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} /></div>
              <div className="form-group"><label>Password</label><input type="password" name="password" value={formData.password} onChange={handleChange} /></div>
              <div className="form-group"><label>Confirm Password</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} /></div>
              <button type="submit" className="login-btn">Register</button>
            </form>
          ) : (
            <>
              <form onSubmit={handleEmailLogin} className="login-form">
                <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} /></div>
                <div className="form-group"><label>Password</label><input type="password" name="password" value={formData.password} onChange={handleChange} /></div>
                <button type="submit" className="login-btn">Login</button>
              </form>
              <div className="divider">OR</div>
              <button onClick={handleGoogleLogin} className="google-btn">Sign in with Google</button>
            </>
          )}

          <p className="signup-link">
            {isRegister ? (
              <>Already have an account? <span onClick={() => setIsRegister(false)}>Login here</span></>
            ) : (
              <>Don’t have an account? <span onClick={() => setIsRegister(true)}>Register here</span></>
            )}
          </p>
        </div>
      </div>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Wordly App | Designed with ❤️ by Rotondwa Rambau</p>
      </footer>
    </div>
  );
};

export default AuthPage;