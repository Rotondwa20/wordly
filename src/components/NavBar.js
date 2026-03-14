/* eslint-disable */
import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onSearch }) => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (onSearch) onSearch(value); // send search text back to parent
  };

  return (
    <div className="navbar-container">
      {/* Top row: logo + search/profile */}
      <div className="navbar-top">
        <div className="navbar-logo" onClick={() => navigate("/")}>
          <div className="navbar-logo-icon">W</div>
          <h1 className="navbar-title">WORDLY</h1>
        </div>

        <div className="navbar-right">
          <div className="navbar-search">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchText}
              onChange={handleSearch}
            />
            <FiSearch className="search-icon" />
          </div>

          <FaUserCircle
            className="user-icon"
            onClick={() => navigate("/Viewprofile")}
          />
        </div>
      </div>

      {/* Menu under top row */}
      <div className="navbar-menu">
        <button onClick={() => navigate("/feed")} className="menu-button">
          Home
        </button>
        <button onClick={() => navigate("/notifications")} className="menu-button">
          Notifications
        </button>
        <button onClick={() => navigate("/community")} className="menu-button">
          Community
        </button>
        <button onClick={() => navigate("/ChatsList")} className="menu-button">
          Messages
        </button>
      </div>

      {/* CSS */}
      <style>{`
        .navbar-container { width: 100%; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; flex-direction: column; font-family: 'Arial', sans-serif; position: sticky; top: 0; z-index: 100; }
        .navbar-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 32px; }
        .navbar-logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .navbar-logo-icon { background-color: #2563eb; color: #fff; font-weight: bold; border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; font-size: 1rem; }
        .navbar-title { font-size: 1.25rem; font-weight: 600; }
        .navbar-right { display: flex; align-items: center; gap: 16px; }
        .navbar-search { display: flex; align-items: center; background-color: #f3f4f6; border-radius: 9999px; padding: 4px 12px; gap: 6px; }
        .navbar-search input { border: none; background: none; outline: none; font-size: 0.95rem; cursor: pointer; }
        .search-icon { font-size: 1.25rem; color: #6b7280; }
        .user-icon { font-size: 1.5rem; color: #2563eb; cursor: pointer; }
        .user-icon:hover { color: #1d4ed8; }
        .navbar-menu { display: flex; justify-content: center; gap: 16px; padding: 8px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb; }
        .menu-button { background: none; border: none; cursor: pointer; font-size: 1rem; font-weight: 500; padding: 6px 12px; border-radius: 6px; transition: background 0.2s, color 0.2s; }
        .menu-button:hover { background-color: #e5e7eb; color: #2563eb; }
      `}</style>
    </div>
  );
};

export default Navbar;