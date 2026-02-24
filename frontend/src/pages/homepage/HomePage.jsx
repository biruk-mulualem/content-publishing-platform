import React, { useState, useEffect, useRef } from "react";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import { getPublishedArticles } from "../publicArticle/service/publicDataService";

const HomePage = () => {
  const navigate = useNavigate();
  const [publicArticles, setPublicArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create refs for each section
  const featuresRef = useRef(null);
  const articlesRef = useRef(null);
  const testimonialsRef = useRef(null);
  const pricingRef = useRef(null);

  const [testimonials] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Tech Blogger",
      content: "ContentFlow has transformed how I publish my technical articles. The editor is a dream to work with!",
      avatar: "👩‍💻",
      rating: 5
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Software Developer",
      content: "The tag filtering system is brilliant. I can organize hundreds of articles effortlessly.",
      avatar: "👨‍💻",
      rating: 5
    },
    {
      id: 3,
      name: "Emma Davis",
      role: "Content Creator",
      content: "Best publishing platform I've used. Simple, powerful, and beautiful.",
      avatar: "👩‍🎨",
      rating: 5
    }
  ]);

  // Function to handle smooth scrolling
  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Helper function to strip HTML for preview
  const stripHtml = (html, maxLength = 100) => {
    if (!html) return "No content available";
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  useEffect(() => {
    const fetchPublicArticles = async () => {
      try {
        setLoading(true);
        // Use the public endpoint - no token needed
        const data = await getPublishedArticles();
        console.log("HomePage - Fetched articles:", data);
        
        // Filter only published articles and take latest 4
        const published = (data || [])
          .filter(article => article.published_status === 1)
          .slice(0, 4);
        
        // Process articles to add preview text
        const processed = published.map(article => ({
          ...article,
          previewText: stripHtml(article.body, 120),
          authorName: article.authorName || article.author || "Anonymous"
        }));
        
        setPublicArticles(processed);
      } catch (err) {
        console.error("Error fetching articles:", err);
        // Set empty array on error
        setPublicArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicArticles();
  }, []);

  // Sample articles if no articles from API
  const sampleArticles = [
    {
      id: 1,
      title: "Getting Started with React Hooks",
      previewText: "Learn how to use useState, useEffect, and other React hooks to build modern applications...",
      authorName: "Sarah Johnson",
      createdAt: "2024-03-15T10:00:00Z",
      readTime: "5 min read",
      tags: ["React", "JavaScript"],
      image: "⚛️"
    },
    {
      id: 2,
      title: "The Future of Web Development",
      previewText: "Exploring emerging trends and technologies that will shape the future of web development...",
      authorName: "Michael Chen",
      createdAt: "2024-03-12T14:30:00Z",
      readTime: "8 min read",
      tags: ["Web Dev", "Trends"],
      image: "🚀"
    },
    {
      id: 3,
      title: "Mastering CSS Grid Layout",
      previewText: "A comprehensive guide to CSS Grid - from basics to advanced layouts with practical examples...",
      authorName: "Emma Davis",
      createdAt: "2024-03-10T09:15:00Z",
      readTime: "6 min read",
      tags: ["CSS", "Design"],
      image: "🎨"
    },
    {
      id: 4,
      title: "Node.js Best Practices 2024",
      previewText: "Essential tips and patterns for building scalable and maintainable Node.js applications...",
      authorName: "Alex Thompson",
      createdAt: "2024-03-08T16:45:00Z",
      readTime: "10 min read",
      tags: ["Node.js", "Backend"],
      image: "🟢"
    }
  ];

  // Use API articles if available, otherwise use samples
  const displayArticles = publicArticles.length > 0 ? publicArticles : sampleArticles;

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="landing">

      {/* NAVBAR */}
      <header className="nav">
        <div className="nav-inner">
          <div className="brand" onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            navigate("/");
          }} style={{ cursor: 'pointer' }}>
            ContentFlow
          </div>
          <nav className="nav-menu">
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
            <a 
              href="#testimonials" 
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(testimonialsRef);
              }}
            >
              Testimonials
            </a>
          </nav>
          <div className="nav-buttons">
            <button
              className="nav-cta"
              onClick={() => navigate("/page/loginpage")}
            >
              Get Started
            </button>
          </div>
          <button className="mobile-menu-btn">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-left">
            <span className="badge"> New Publishing Experience</span>
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
                  <span className="preview-icon">🟢</span>
                  <div className="preview-text">
                    <h4>Getting Started with React</h4>
                    <p>Published • 5 min read</p>
                  </div>
                </div>
                <div className="preview-item">
                  <span className="preview-icon">📝</span>
                  <div className="preview-text">
                    <h4>CSS Grid Mastery</h4>
                    <p>Draft • In progress</p>
                  </div>
                </div>
                <div className="preview-item">
                  <span className="preview-icon">📊</span>
                  <div className="preview-text">
                    <h4>Monthly Analytics</h4>
                    <p>1.2K views • 23 comments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" ref={featuresRef} className="features-section">
        <div className="section-header">
          <span className="section-badge">Why Choose Us</span>
          <h2>Everything You Need to Publish</h2>
          <p>Powerful features that make content creation a joy</p>
        </div>
        <div className="features-grid">
  <div className="feature-card">
    <div className="feature-icon-wrapper">
      <span className="feature-icon">📝</span>
    </div>
    <h3>Article Management</h3>
    <p>Create, edit, and manage your articles with ease.</p>
    <ul className="feature-list">
      <li>✅ Create and edit articles</li>
      <li>✅ Rich text formatting</li>
      <li>✅ Draft/Published workflow</li>
    </ul>
  </div>

  <div className="feature-card">
    <div className="feature-icon-wrapper">
      <span className="feature-icon">🏷️</span>
    </div>
    <h3>Tag System</h3>
    <p>Organize and discover content with tags.</p>
    <ul className="feature-list">
      <li>✅ Add up to 10 tags per article</li>
      <li>✅ Filter articles by tag</li>
      <li>✅ Popular tags analytics</li>
    </ul>
  </div>

  <div className="feature-card">
    <div className="feature-icon-wrapper">
      <span className="feature-icon">📊</span>
    </div>
    <h3>Author Dashboard</h3>
    <p>Track your content performance and manage your articles.</p>
    <ul className="feature-list">
      <li>✅ Article statistics</li>
      <li>✅ Like and comment tracking</li>
      <li>✅ Quick actions menu</li>
    </ul>
  </div>

  <div className="feature-card">
    <div className="feature-icon-wrapper">
      <span className="feature-icon">👑</span>
    </div>
    <h3>Admin Dashboard</h3>
    <p>Complete system oversight and analytics.</p>
    <ul className="feature-list">
      <li>✅ System-wide statistics</li>
      <li>✅ User and content monitoring</li>
      <li>✅ Activity logs and insights</li>
    </ul>
  </div>
</div>
      </section>

      {/* PUBLIC ARTICLES SECTION */}
      <section id="articles" ref={articlesRef} className="articles-section">
        <div className="section-header">
          <span className="section-badge">Latest Articles</span>
          <h2>Read from Our Community</h2>
          <p>Discover amazing content from talented writers around the world</p>
        </div>

        {loading ? (
          <div className="articles-loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div className="articles-grid">
              {displayArticles.map((article) => (
                <div 
                  key={article.id} 
                  className="article-card"
                  
                  style={{ cursor: 'pointer' }}
                >
                  <div className="article-content">
                    <div className="article-meta">
                      <span className="article-author">
                        👤 {article.authorName || article.author || article.authorName || "Anonymous"}
                      </span>
                      <span className="article-date">
                        📅 {article.date ? article.date : formatDate(article.createdAt)}
                      </span>
                    </div>
                    
                    <h3>{article.title}</h3>

                    {/* Preview with stripped HTML */}
                    <div 
                      className="article-excerpt"
                      dangerouslySetInnerHTML={{ 
                        __html: article.previewText || 
                                article.excerpt || 
                                article.body?.substring(0, 100) + "..." 
                      }}
                    />

                    <div className="article-footer">
                      <div className="article-tags">
                        {article.tags && article.tags.slice(0, 2).map((tag, i) => (
                          <span 
                            key={i} 
                            className="article-tag"
                            onClick={(e) => {
                              e.stopPropagation();
                              // You could add tag filtering here if needed
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                        {article.tags?.length > 2 && (
                          <span className="article-tag more">+{article.tags.length - 2}</span>
                        )}
                      </div>
                     
                    </div>
                    
                    <button 
                      className="article-read-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/public/articles/${article.id}`);
                      }}
                    >
                      Read Article →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="view-more-container">
              <button 
                className="view-more-btn"
                onClick={() => {
                  navigate("/page/publicArticlesPage");
                  window.scrollTo(0, 0);
                }}
              >
                View All Articles
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </>
        )}
      </section>

     

      {/* TESTIMONIALS */}
      <section id="testimonials" ref={testimonialsRef} className="testimonials-section">
        <div className="section-header">
          <span className="section-badge">Testimonials</span>
          <h2>What Our Writers Say</h2>
          <p>Join thousands of satisfied content creators</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="testimonial-rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="star">★</span>
                ))}
              </div>
              <p className="testimonial-content">"{testimonial.content}"</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar">{testimonial.avatar}</span>
                <div className="testimonial-info">
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Share Your Story?</h2>
          <p>Join thousands of creators building their audience with ContentFlow.</p>
          <div className="cta-buttons">
            <button className="btn-primary large" onClick={() => navigate("/page/loginpage")}>
              <span className="btn-icon"></span>
              Create Free Account
            </button>
            <button className="btn-outline light" onClick={() => navigate("/page/loginpage")}>
              <span className="btn-icon"></span>
              Sign In
            </button>
          </div>
          <p className="cta-note">No credit card required • Free forever</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            
            <span className="brand-text">ContentFlow</span>
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
          <p>© 2026 ContentFlow. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;