/* eslint-disable */
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Pagescss/About.css"; // new stylesheet

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="about-background">
      {/* ===== NAVBAR ===== */}
      <nav className="navbar">
        <h1 className="nav-logo" onClick={() => navigate("/")}>Wordly</h1>
        <div className="nav-links">
          <span onClick={() => navigate("/")}>Home</span>
          <span onClick={() => navigate("/about")}>About</span>
          <span onClick={() => navigate("/login")}>Login</span>
        </div>
      </nav>

      {/* ===== ABOUT CONTENT ===== */}
      <div className="about-container">
        <h2 className="about-title">About Wordly</h2>
        <p className="about-intro">
          Wordly is a modern blogging platform that lets users express themselves freely. 
          It provides a simple, mobile-friendly space to write, edit, and publish blogs 
          while interacting with other users in a creative community.
        </p>

        <div className="about-sections">
          <div className="about-card">
            <h3>Our Mission</h3>
            <p>
              Our mission is to give every voice a platform. Whether you’re a writer, 
              storyteller, or creator, Wordly helps you share your thoughts with the world 
              through clean design and intuitive features.
            </p>
          </div>

          <div className="about-card">
            <h3>What We Offer</h3>
            <p>
              Wordly allows users to write and edit posts with ease, connect with 
              like-minded people, and discover trending topics in a secure and 
              friendly environment.
            </p>
          </div>

          <div className="about-card">
            <h3>Our Vision</h3>
            <p>
              We aim to become a global hub for digital storytelling — where creativity, 
              authenticity, and connection thrive through technology.
            </p>
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Wordly App | Designed with ❤️ by Tondy Rambau</p>
      </footer>
    </div>
  );
};

export default About;
