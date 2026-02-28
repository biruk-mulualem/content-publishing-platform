// pages/dashboard/components/RecentArticles.jsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const RecentArticles = ({ articles }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get preview content
  const getPreview = (article) => {
    if (article.previewText) return article.previewText;
    if (article.body) {
      // Remove HTML tags
      const stripped = article.body.replace(/<[^>]*>/g, '');
      return stripped.length > 100 ? stripped.substring(0, 100) + '...' : stripped;
    }
    if (article.excerpt) return article.excerpt;
    return "Click to read this article...";
  };

  // Truncate title
  const truncateTitle = (title, maxLength = 50) => {
    if (!title) return "Untitled";
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="recent-box">
        <div className="box-header">
          <h2>
            <span className="header-icon">📋</span>
            Recent Articles
          </h2>
          <button className="view-all" onClick={() => navigate("/page/articlepage")}>
            View All →
          </button>
        </div>

        <div className="mobile-articles-list">
          {articles.length > 0 ? (
            articles.slice(0, 5).map((article) => (
              <div 
                key={article.id} 
                className="mobile-article-card"
                onClick={() => navigate(`/articles/${article.id}`)}
              >
                {/* Header with Title and Status */}
                <div className="mobile-article-header">
                  <h4 className="mobile-article-title">
                    {truncateTitle(article.title)}
                  </h4>
                  <span className={`mobile-badge ${article.published_status === 1 ? "published" : "draft"}`}>
                    {article.published_status === 1 ? "Published" : "Draft"}
                  </span>
                </div>
                
                {/* Article Preview - FULLY VISIBLE NOW */}
                <div className="mobile-article-preview">
                  {getPreview(article)}
                </div>
                
                {/* Footer with Date and Stats */}
                <div className="mobile-article-footer">
                  <div className="mobile-article-date">
                    <span>📅</span> {formatDate(article.createdAt)}
                  </div>
                  <div className="mobile-article-stats">
                    <span className="mobile-stat">
                      <span>❤️</span> {article.likesCount || 0}
                    </span>
                    <span className="mobile-stat">
                      <span>💬</span> {article.commentsCount || 0}
                    </span>
                  </div>
                </div>

                {/* Read More Indicator */}
                {/* <div className="mobile-read-more">
                  Tap to read full article →
                </div> */}
              </div>
            ))
          ) : (
            <div className="no-data-mobile">
              <div className="empty-icon">📝</div>
              <p>No articles yet</p>
              <button 
                className="create-first-btn"
                onClick={() => {/* Trigger create modal */}}
              >
                Write Your First Article
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="recent-box">
      <div className="box-header">
        <h2>
          <span className="header-icon">📋</span>
          My Recent Articles
        </h2>
        <button className="view-all" onClick={() => navigate("/page/articlepage")}>
          Manage All <span>→</span>
        </button>
      </div>

      <div className="table-responsive">
        <table className="article-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
              <th>Likes</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            {articles.length > 0 ? (
              articles.slice(0, 4).map((article) => (
                <tr key={article.id} onClick={() => navigate(`/articles/${article.id}`)}>
                  <td className="article-title">{article.title}</td>
                  <td>
                    <span className={`badge ${article.published_status === 1 ? "published" : "draft"}`}>
                      {article.published_status === 1 ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>{formatDate(article.createdAt)}</td>
                  <td>{article.likesCount || 0}</td>
                  <td>{article.commentsCount || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No articles yet. Create your first article!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentArticles;