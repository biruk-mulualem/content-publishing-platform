// pages/homepage/components/HomeNavbar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HomeNavbar = ({ scrollToSection, featuresRef, articlesRef, testimonialsRef }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = (e, ref) => {
    e.preventDefault();
    scrollToSection(ref);
    setIsMenuOpen(false);
  };

  const handleGetStarted = () => {
    // Just navigate to login page - the login page will handle cleanup
    navigate("/page/loginpage");
    setIsMenuOpen(false);
  };

  const handleBrandClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate("/");
    setIsMenuOpen(false);
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="brand" onClick={handleBrandClick} style={{ cursor: 'pointer' }}>
          PublishHub
        </div>
        
        {/* Desktop Navigation */}
        <nav className="nav-menu">
          <a 
            href="#features" 
            onClick={(e) => handleLinkClick(e, featuresRef)}
          >
            Features
          </a>
          <a 
            href="#articles" 
            onClick={(e) => handleLinkClick(e, articlesRef)}
          >
            Articles
          </a>
          <a 
            href="#testimonials" 
            onClick={(e) => handleLinkClick(e, testimonialsRef)}
          >
            Testimonials
          </a>
        </nav>
        
        <div className="nav-buttons">
          <button className="nav-cta" onClick={handleGetStarted}>
            Get Started
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button className={`mobile-menu-btn ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <nav className="mobile-nav">
          <a 
            href="#features" 
            onClick={(e) => handleLinkClick(e, featuresRef)}
          >
            Features
          </a>
          <a 
            href="#articles" 
            onClick={(e) => handleLinkClick(e, articlesRef)}
          >
            Articles
          </a>
          <a 
            href="#testimonials" 
            onClick={(e) => handleLinkClick(e, testimonialsRef)}
          >
            Testimonials
          </a>
          <button className="mobile-cta" onClick={handleGetStarted}>
            Get Started
          </button>
        </nav>
      </div>
    </header>
  );
};

export default HomeNavbar;