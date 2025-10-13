/* eslint-disable */
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../Firebase/Firebase"; 
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Pagescss/Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.dob ||
      !formData.phoneNumber ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setMessage({ type: "error", text: "All fields are required." });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        createdAt: new Date().toISOString(),
      });

      setMessage({
        type: "success",
        text: "Registration successful! Redirecting to login...",
      });

      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  return (
    <div className="register-background">
      {/* ===== NAVBAR ===== */}
      <nav className="navbar">
        <h1 className="nav-logo" onClick={() => navigate("/")}>Wordly</h1>
        <div className="nav-links">
          <span onClick={() => navigate("/")}>Home</span>
          <span onClick={() => navigate("/about")}>About</span>
          <span onClick={() => navigate("/Login")}>Login</span>
        </div>
      </nav>

      {/* ===== REGISTER FORM ===== */}
      <div className="register-container">
        <h2>Create Your Wordly Account</h2>

        {message.text && (
          <p className={message.type === "error" ? "error" : "success"}>
            {message.text}
          </p>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Enter your phone number"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
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
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="register-btn">
            Register
          </button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login here</span>
        </p>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Wordly App | Designed with ❤️ by Tondy Rambau</p>
      </footer>
    </div>
  );
};

export default Register;
