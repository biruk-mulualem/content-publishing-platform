import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ArticleDetailPage.css";
import { getArticleById } from "../services/articleService";
import Header from "../../../components/shared/header/Header.jsx";

const ArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      try {
        const data = await getArticleById(id, token);
        setArticle(data);
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Failed to load article");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id, token]);

  // Format date if available
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="detail-page-wrapper">
       
        <div className="detail-page-layout">
        
          <main className="detail-page-content">
            <div className="detail-loading-container">
              <div className="spinner"></div>
              <p>Loading article...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="detail-page-wrapper">
   <Header />
        <div className="detail-page-layout">
        
          <main className="detail-page-content">
            <div className="detail-error-container">
              <span className="error-icon">🔍</span>
              <h2>Article Not Found</h2>
              <p>{error || "The article you're looking for doesn't exist or has been removed."}</p>
              <button className="detail-back-btn" onClick={() => navigate('/page/articlepage')}>
                <span className="btn-icon">←</span>
                Back to Articles
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page-wrapper">
         <Header />
      <div className="detail-page-layout">
        
        <main className="detail-page-content">
          <div className="detail-article-container">
            {/* Back Button */}
            <button className="detail-back-btn" onClick={() => navigate('/page/articlepage')}>
              <span className="btn-icon">←</span>
              Back to Articles
            </button>

            {/* Article Header */}
            <div className="detail-article-header">
              <h1 className="detail-article-title">{article.title}</h1>
              
              <div className="detail-status-badge">
                <span className={`detail-status ${article.published_status === 1 ? 'published' : 'draft'}`}>
                  {article.published_status === 1 ? 'Published' : 'Draft'}
                </span>
              </div>
              
              <div className="detail-meta-grid">
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Author</span>
                  <span className="detail-meta-value">{article.authorName || "Unknown"}</span>
                </div>
                
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Published</span>
                  <span className="detail-meta-value">{formatDate(article.createdAt)}</span>
                </div>

                {/* Stats Section - Added */}
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Engagement</span>
                  <div className="detail-engagement-stats">
                    <span className="engagement-badge">
                      <span className="engagement-icon">❤️</span>
                      <span className="engagement-count">{article.likesCount || 0}</span>
                    </span>
                    <span className="engagement-badge">
                      <span className="engagement-icon">💬</span>
                      <span className="engagement-count">{article.commentsCount || 0}</span>
                    </span>
                  </div>
                </div>
                
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Tags</span>
                  <div className="detail-tags">
                    {article.tags && article.tags.length > 0 ? (
                      article.tags.map((tag, index) => (
                        <span key={index} className="detail-tag">{tag}</span>
                      ))
                    ) : (
                      <span className="detail-no-tags">No tags</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Article Body */}
            <div className="detail-body-section">
              <h2 className="detail-body-title">Article Content</h2>
              <div 
                className="detail-article-body"
                dangerouslySetInnerHTML={{ 
                  __html: article.body || "<p class='no-content'>No content available for this article.</p>" 
                }}
              />
            </div>

            {/* Comments Section - Added */}
            {article.comments && article.comments.length > 0 && (
              <div className="detail-comments-section">
                <h2 className="detail-comments-title">Comments ({article.comments.length})</h2>
                <div className="detail-comments-list">
                  {article.comments.map((comment) => (
                    <div key={comment.id} className="detail-comment-item">
                      <div className="detail-comment-header">
                        <span className="detail-comment-name">{comment.name}</span>
                        <span className="detail-comment-date">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="detail-comment-text">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ArticleDetailPage;