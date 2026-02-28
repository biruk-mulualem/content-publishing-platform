// pages/homepage/HomePage.jsx
import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

// Import all homepage components
import HomeNavbar from "./components/HomeNavbar";
import HomeHero from "./components/HomeHero";
import HomeFeatures from "./components/HomeFeatures";
import HomeArticles from "./components/HomeArticles";
import HomeTestimonials from "./components/HomeTestimonials";
import HomeCTA from "./components/HomeCTA";
import HomeFooter from "./components/HomeFooter";

const HomePage = () => {
  const navigate = useNavigate();
  
  // Create refs for each section
  const featuresRef = useRef(null);
  const articlesRef = useRef(null);
  const testimonialsRef = useRef(null);

  // Function to handle smooth scrolling
  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="landing">
      {/* Navbar Component */}
      <HomeNavbar 
        scrollToSection={scrollToSection}
        featuresRef={featuresRef}
        articlesRef={articlesRef}
        testimonialsRef={testimonialsRef}
      />

      {/* Hero Component */}
      <HomeHero />

      {/* Features Component with ref */}
      <div ref={featuresRef}>
        <HomeFeatures />
      </div>

      {/* Articles Component with ref */}
      <div ref={articlesRef}>
        <HomeArticles />
      </div>

      {/* Testimonials Component with ref */}
      <div ref={testimonialsRef}>
        <HomeTestimonials />
      </div>

      {/* CTA Component */}
      <HomeCTA />

      {/* Footer Component */}
      <HomeFooter 
        scrollToSection={scrollToSection}
        featuresRef={featuresRef}
        articlesRef={articlesRef}
      />
    </div>
  );
};

export default HomePage;