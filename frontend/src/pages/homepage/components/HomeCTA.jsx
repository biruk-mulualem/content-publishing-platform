// pages/homepage/components/HomeCTA.jsx
import { useNavigate } from "react-router-dom";

const HomeCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="cta-section">
      <div className="cta-content">
        <h2>Ready to Share Your Story?</h2>
        <p>Join thousands of creators building their audience with PublishHub.</p>
        <div className="cta-buttons">
          <button className="btn-primary large" onClick={() => navigate("/page/loginpage")}>
            Create Free Account
          </button>
          <button className="btn-outline light" onClick={() => navigate("/page/loginpage")}>
            Sign In
          </button>
        </div>
        <p className="cta-note">No credit card required • Free forever</p>
      </div>
    </section>
  );
};

export default HomeCTA;