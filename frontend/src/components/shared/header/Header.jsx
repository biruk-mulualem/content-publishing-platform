// components/shared/header/Header.jsx
import React, { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import "./header.css";
import { logoutUser } from "../../../services/authService";

const Header = memo(() => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("author");
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedEmail = localStorage.getItem("userEmail");
    const storedRole = localStorage.getItem("userRole");
    
    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);
    if (storedRole) setUserRole(storedRole);
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
    if (isMobileMenuOpen) setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
    if (isDropdownOpen) setDropdownOpen(false);
  };

  const handleLogout = () => {
    logoutUser();
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on window resize (if going to desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Add scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.top-nav');
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="top-nav">
      <div className="nav-left">
        <div 
          className="logo" 
          onClick={() => handleNavigation(userRole === 'admin' ? "/page/adminDashboard" : "/page/dashboard")}
        >
          <span className="logo-icon">📚</span>
          PublishHub
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-links desktop-nav">
          {userRole === 'author' && (
            <>
              <button 
                className={`nav-link ${window.location.pathname === '/page/dashboard' ? 'active' : ''}`}
                onClick={() => handleNavigation("/page/dashboard")}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Dashboard</span>
              </button>
              
              <button 
                className={`nav-link ${window.location.pathname === '/page/articlepage' ? 'active' : ''}`}
                onClick={() => handleNavigation("/page/articlepage")}
              >
                <span className="nav-icon">📝</span>
                <span className="nav-text">Articles</span>
              </button>
            </>
          )}

          {userRole === 'admin' && (
            <button 
              className={`nav-link ${window.location.pathname === '/page/logs' ? 'active' : ''}`}
              onClick={() => handleNavigation("/page/logs")}
            >
              <span className="nav-icon">📋</span>
              <span className="nav-text">Logs</span>
            </button>
          )}
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <button 
        className={`mobile-menu-btn ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`} ref={mobileMenuRef}>
        <div className="mobile-menu-header">
          <div className="mobile-user-info">
            <span className="mobile-user-name">{userName}</span>
            <span className="mobile-user-email">{userEmail || "No email"}</span>
            <span className="mobile-user-role">
              {userRole === 'admin' ? 'Administrator' : 'Author'}
            </span>
          </div>
        </div>
        
        <nav className="mobile-nav-links">
          {userRole === 'author' && (
            <>
              <button 
                className={`mobile-nav-link ${window.location.pathname === '/page/dashboard' ? 'active' : ''}`}
                onClick={() => handleNavigation("/page/dashboard")}
              >
                <span className="mobile-nav-icon">📊</span>
                <span className="mobile-nav-text">Dashboard</span>
              </button>
              
              <button 
                className={`mobile-nav-link ${window.location.pathname === '/page/articlepage' ? 'active' : ''}`}
                onClick={() => handleNavigation("/page/articlepage")}
              >
                <span className="mobile-nav-icon">📝</span>
                <span className="mobile-nav-text">Articles</span>
              </button>
            </>
          )}

          {userRole === 'admin' && (
            <button 
              className={`mobile-nav-link ${window.location.pathname === '/page/logs' ? 'active' : ''}`}
              onClick={() => handleNavigation("/page/logs")}
            >
              <span className="mobile-nav-icon">📋</span>
              <span className="mobile-nav-text">Logs</span>
            </button>
          )}

          <button className="mobile-nav-link logout" onClick={handleLogout}>
            <span className="mobile-nav-icon">🚪</span>
            <span className="mobile-nav-text">Logout</span>
          </button>
        </nav>
      </div>

      {/* User Profile Section (Desktop) */}
      <div className="user-profile desktop-only" ref={dropdownRef}>
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
});

export default Header;