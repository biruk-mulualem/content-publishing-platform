// pages/homepage/components/HomeArticles.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPublishedArticles } from "../../../services/articleService";

// Helper functions
const stripHtml = (html, maxLength = 120) => {
  if (!html) return "No content available";
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

const formatDate = (dateString) => {
  if (!dateString) return "Unknown date";
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const HomeArticles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const sampleArticles = [
    {
      id: 1,
      title: "Getting Started with React Hooks",
      previewText: "Learn how to use useState, useEffect, and other React hooks to build modern applications...",
      authorName: "Sarah Johnson",
      createdAt: "2024-03-15T10:00:00Z",
      tags: ["React", "JavaScript"]
    },
    {
      id: 2,
      title: "The Future of Web Development",
      previewText: "Exploring emerging trends and technologies that will shape the future of web development...",
      authorName: "Michael Chen",
      createdAt: "2024-03-12T14:30:00Z",
      tags: ["Web Dev", "Trends"]
    },
    {
      id: 3,
      title: "Mastering CSS Grid Layout",
      previewText: "A comprehensive guide to CSS Grid - from basics to advanced layouts with practical examples...",
      authorName: "Emma Davis",
      createdAt: "2024-03-10T09:15:00Z",
      tags: ["CSS", "Design"]
    },
    {
      id: 4,
      title: "Node.js Best Practices 2024",
      previewText: "Essential tips and patterns for building scalable and maintainable Node.js applications...",
      authorName: "Alex Thompson",
      createdAt: "2024-03-08T16:45:00Z",
      tags: ["Node.js", "Backend"]
    }
  ];

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const data = await getPublishedArticles();
        const published = (data || [])
          .filter(article => article.published_status === 1)
          .slice(0, 4)
          .map(article => ({
            ...article,
            previewText: stripHtml(article.body, 120),
            authorName: article.authorName || "Anonymous"
          }));
        setArticles(published);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const displayArticles = articles.length > 0 ? articles : sampleArticles;

  if (loading) {
    return (
      <section className="articles-section">
        <div className="articles-loading">
          <div className="spinner"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="articles-section">
      <div className="section-header">
        <span className="section-badge">Latest Articles</span>
        <h2>Read from Our Community</h2>
        <p>Discover amazing content from talented writers around the world</p>
      </div>

      <div className="articles-grid">
        {displayArticles.map((article) => (
          <div key={article.id} className="article-card">
            <div className="article-content">
              <div className="article-meta">
                <span className="article-author">👤 {article.authorName}</span>
                <span className="article-date">📅 {formatDate(article.createdAt)}</span>
              </div>
              <h3>{article.title}</h3>
              <div className="article-excerpt">{article.previewText}</div>
              <div className="article-footer">
                <div className="article-tags">
                  {article.tags?.slice(0, 2).map((tag, i) => (
                    <span key={i} className="article-tag">#{tag}</span>
                  ))}
                  {article.tags?.length > 2 && (
                    <span className="article-tag more">+{article.tags.length - 2}</span>
                  )}
                </div>
              </div>
              <button 
                className="article-read-btn"
                onClick={() => navigate(`/public/articles/${article.id}`)}
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
    </section>
  );
};

export default HomeArticles;