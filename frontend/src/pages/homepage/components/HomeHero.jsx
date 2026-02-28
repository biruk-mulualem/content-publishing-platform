// pages/homepage/components/HomeHero.jsx
import { useNavigate } from "react-router-dom";

const HomeHero = () => {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="hero-grid">
        <div className="hero-left">
          <span className="badge">New Publishing Experience</span>
          <h1>
            Write, Publish,
            <br />
            <span className="gradient-text">Grow Your Audience</span>
          </h1>
          <p className="hero-description">
            A powerful content publishing system built for creators, developers, 
            and modern teams. Join thousands of writers sharing their stories.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate("/page/loginpage")}>
              Start Writing
            </button>
          </div>
        </div>

        <div className="hero-right">
          <div className="dashboard-preview">
            <div className="preview-header">
              <span className="preview-dot"></span>
              <span className="preview-dot"></span>
              <span className="preview-dot"></span>
            </div>
            <div className="preview-content">
  <div className="preview-item active">
    <span className="preview-icon">📝</span>
    <div className="preview-text">
      <h4>Articles</h4>
      <p>4700+ total • 12 + drafts</p>
    </div>
  </div>
  <div className="preview-item">
    <span className="preview-icon">👥</span>
    <div className="preview-text">
      <h4>Users</h4>
      <p>1,234 + total • 89 + new</p>
    </div>
  </div>
  <div className="preview-item">
    <span className="preview-icon">❤️</span>
    <div className="preview-text">
      <h4>Engagement</h4>
      <p>3.4K likes • 892 + comments</p>
    </div>
  </div>
</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;