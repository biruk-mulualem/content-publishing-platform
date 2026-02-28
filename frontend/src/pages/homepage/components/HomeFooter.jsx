// pages/homepage/components/HomeFooter.jsx
const HomeFooter = ({ scrollToSection, featuresRef, articlesRef }) => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="brand-text">PublishHub</span>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h4>Product</h4>
            <a 
              href="#features" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(featuresRef);
              }}
            >
              Features
            </a>
            <a 
              href="#articles" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(articlesRef);
              }}
            >
              Articles
            </a>
          </div>
          <div className="footer-column">
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#blog">Blog</a>
            <a href="#careers">Careers</a>
          </div>
          <div className="footer-column">
            <h4>Resources</h4>
            <a href="#help">Help Center</a>
            <a href="#docs">Documentation</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#cookies">Cookies</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 PublishHub. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default HomeFooter;