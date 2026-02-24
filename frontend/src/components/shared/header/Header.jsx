import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./header.css";
import { logoutUser } from "./service/logoutService";

const Header = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("author");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedEmail = localStorage.getItem("userEmail");
    const storedRole = localStorage.getItem("userRole");
    
    if (storedName) {
      setUserName(storedName);
    }
    
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
    
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  // 🔥 FIXED: Proper logout that prevents back button access
  const handleLogout = () => {
    // Call the logout service
    logoutUser();
    
    // No need to navigate - logoutUser does a hard redirect
    // This ensures all React state is cleared
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="top-nav">
      <div className="nav-left">

        {userRole === 'admin' && (
          <div className="logo" onClick={() => navigate("/page/adminDashboard")}>
            PublishHub
          </div>
        )}

        {userRole === 'author' && (
          <div className="logo" onClick={() => navigate("/page/dashboard")}>
            PublishHub
          </div>
        )}

        {/* Author Navigation */}
        {userRole === 'author' && (
          <nav className="nav-links">
            <button 
              className={`nav-link ${window.location.pathname === '/page/dashboard' ? 'active' : ''}`}
              onClick={() => navigate("/page/dashboard")}
            >
              <span className="nav-text">Dashboard</span>
            </button>
            
            <button 
              className={`nav-link ${window.location.pathname === '/page/articlepage' ? 'active' : ''}`}
              onClick={() => navigate("/page/articlepage")}
            >
              <span className="nav-text">Articles</span>
            </button>
          </nav>
        )}

        {/* Admin Navigation */}
        {userRole === 'admin' && (
          <nav className="nav-links">
            {/* <button 
              className={`nav-link ${window.location.pathname === '/page/adminDashboard' ? 'active' : ''}`}
              onClick={() => navigate("/page/adminDashboard")}
            >
              <span className="nav-text">Dashboard</span>
            </button> */}
            <button 
              className={`nav-link ${window.location.pathname === '/page/admin/logs' ? 'active' : ''}`}
              onClick={() => navigate("/page/logs")}
            >
              <span className="nav-text">Logs</span>
            </button>
          </nav>
        )}
      </div>

      {/* User Profile Section */}
      <div className="user-profile" ref={dropdownRef}>
        <div className="profile-icon" onClick={toggleDropdown}>
          <div className="avatar-container">
            <img 
              src="https://www.w3schools.com/howto/img_avatar.png"
              alt="User Profile"
              className="profile-image"
            />
            <span className="online-indicator"></span>
          </div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-role">
              {userRole === 'admin' ? 'Administrator' : 'Author'}
            </span>
          </div>
          <span className={`triangle-icon ${isDropdownOpen ? 'open' : ''}`}>▼</span>
        </div>

        {isDropdownOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <div className="dropdown-avatar">
                <img 
                  src="https://www.w3schools.com/howto/img_avatar.png"
                  alt="User"
                />
              </div>
              <div className="dropdown-user-info">
                <span className="dropdown-user-name">{userName}</span>
                <span className="dropdown-user-email">{userEmail || "No email provided"}</span>
                <span className="dropdown-user-role">
                  {userRole === 'admin' ? 'Administrator' : 'Author'}
                </span>
              </div>
            </div>
            
            <div className="dropdown-divider"></div>
            
            <button className="dropdown-item logout-btn" onClick={handleLogout}>
              <span className="item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 16L21 12M21 12L17 8M21 12H9M15 16V17C15 19.2091 13.2091 21 11 21H7C4.79086 21 3 19.2091 3 17V7C3 4.79086 4.79086 3 7 3H11C13.2091 3 15 4.79086 15 7V8" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="item-text">Log Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;