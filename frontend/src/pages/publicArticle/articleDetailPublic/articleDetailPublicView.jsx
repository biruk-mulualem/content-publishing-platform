import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./articleDetailPublicView.css";
import { 
  getPublicArticleById, 
  toggleLike, 
  getLikeStatus, 
  createComment,
  getArticleComments 
} from "../service/publicDataService";

const ArticleDetailPublicView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Like functionality
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  
  // Comment functionality
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentName, setCommentName] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      try {
        const data = await getPublicArticleById(id);
        setArticle(data);
        
        // Fetch like status and comments from API
        try {
          const likeData = await getLikeStatus(id);
          setHasLiked(likeData.liked);
          setLikes(likeData.likesCount);
        } catch (likeErr) {
          console.error("Error fetching like status:", likeErr);
          // Fallback to demo data if API fails
          setLikes(24);
        }
        
        try {
          const commentsData = await getArticleComments(id);
          setComments(commentsData);
        } catch (commentErr) {
          console.error("Error fetching comments:", commentErr);
          // Fallback to demo comments if API fails
          setComments([
            {
              id: 1,
              name: "Sarah Johnson",
              text: "This is such an insightful article! Really enjoyed reading it. The way you explained complex concepts made it easy to understand.",
              date: "2024-02-15T10:30:00Z"
            },
            {
              id: 2,
              name: "Michael Chen",
              text: "Great work! I've been following your content and this might be your best one yet. Looking forward to more articles like this.",
              date: "2024-02-14T15:45:00Z"
            },
            {
              id: 3,
              name: "Emma Williams",
              text: "Thanks for sharing this. It gave me a new perspective on the topic. Would love to see a follow-up article diving deeper into this.",
              date: "2024-02-13T09:20:00Z"
            }
          ]);
        }
        
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
  }, [id]);

  // Handle like
  const handleLike = async () => {
    try {
      const result = await toggleLike(id);
      setHasLiked(result.liked);
      setLikes(result.likesCount);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Fallback to localStorage if API fails
      if (!hasLiked) {
        const newLikes = likes + 1;
        setLikes(newLikes);
        setHasLiked(true);
        localStorage.setItem(`article_likes_${id}`, newLikes.toString());
        localStorage.setItem(`article_liked_${id}`, 'true');
      } else {
        const newLikes = likes - 1;
        setLikes(newLikes);
        setHasLiked(false);
        localStorage.setItem(`article_likes_${id}`, newLikes.toString());
        localStorage.setItem(`article_liked_${id}`, 'false');
      }
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (newComment.trim() && commentName.trim()) {
      try {
        const result = await createComment(id, commentName, newComment);
        
        // Add the new comment to the list
        const newCommentObj = {
          id: result.comment.id,
          name: result.comment.name,
          text: result.comment.comment,
          date: result.comment.createdAt
        };
        
        const updatedComments = [newCommentObj, ...comments];
        setComments(updatedComments);
        
        // Clear form
        setNewComment("");
        setCommentName("");
        setShowCommentForm(false);
        
      } catch (error) {
        console.error("Error posting comment:", error);
        // Fallback to localStorage if API fails
        const newCommentObj = {
          id: Date.now(),
          name: commentName,
          text: newComment,
          date: new Date().toISOString()
        };
        
        const updatedComments = [newCommentObj, ...comments];
        setComments(updatedComments);
        localStorage.setItem(`article_comments_${id}`, JSON.stringify(updatedComments));
        
        setNewComment("");
        setCommentName("");
        setShowCommentForm(false);
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format comment date
// Format comment date - FIXED VERSION
const formatCommentDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Reset time to compare dates only (more accurate)
  const commentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = Math.abs(todayDate - commentDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Changed from Math.ceil to Math.floor
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
};

  if (isLoading) {
    return (
      <div className="pub-detail-wrapper">
        <Header />
        <div className="pub-detail-loading">
          <div className="spinner"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="pub-detail-wrapper">
        <Header />
        <div className="pub-detail-error">
          <span className="error-icon">📄</span>
          <h2>Article Not Found</h2>
          <p>{error || "The article you're looking for doesn't exist or has been removed."}</p>
          <button className="pub-detail-back-btn" onClick={() => navigate('/page/publicArticlesPage')}>
            ← Back to Articles
          </button>
        </div>
      </div>
    );
  }

 // In your return statement, update the layout div:
return (
  <div className="pub-detail-wrapper">
    <Header />
    
    <main className="pub-detail-main">
      {/* Back Button */}
      <button 
        className="pub-detail-back-btn"
        onClick={() => navigate('/page/publicArticlesPage')}
      >
        ← Back to Articles
      </button>

      {/* Two Column Layout - FIXED */}
      <div className="pub-detail-layout">
        {/* Left Column - Article */}
        <div className="pub-detail-left-column">
          {/* Article Header */}
          <header className="pub-detail-header">
            <h1 className="pub-detail-title">{article.title}</h1>
            
            <div className="pub-detail-meta">
              <span className="pub-detail-author">
                By {article.authorName || "Anonymous"}
              </span>
              <span className="pub-detail-date">
                {formatDate(article.createdAt)}
              </span>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="pub-detail-tags">
                {article.tags.map((tag, index) => (
                  <span key={index} className="pub-detail-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Article Content */}
          <article className="pub-detail-article">
            <div 
              className="pub-detail-body"
              dangerouslySetInnerHTML={{ 
                __html: article.body || "<p>No content available for this article.</p>" 
              }}
            />
          </article>
        </div>

        {/* Right Column - Comments */}
        <div className="pub-detail-right-column">
          {/* Like Button */}
          <div className="pub-detail-like-container">
            <button 
              className={`like-button ${hasLiked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              <span className="like-icon">{hasLiked ? '❤️' : '🤍'}</span>
              <span className="like-count">{likes}</span>
            </button>
            <span className="like-text">
              {likes === 0 ? 'Be the first to like' : `${likes} likes`}
            </span>
          </div>

          {/* Comments Section */}
          <section className="pub-detail-comments-section">
            <div className="comments-header">
              <h2 className="comments-title">Comments ({comments.length})</h2>
              <button 
                className="write-comment-btn"
                onClick={() => setShowCommentForm(!showCommentForm)}
              >
                {showCommentForm ? 'Cancel' : 'Write'}
              </button>
            </div>

            {/* Comment Form */}
            {showCommentForm && (
              <form className="comment-form" onSubmit={handleCommentSubmit}>
                <input
                  type="text"
                  className="comment-name-input"
                  placeholder="Your name *"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  required
                />
                <textarea
                  className="comment-textarea"
                  placeholder="Share your thoughts... *"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                  rows="3"
                />
                <div className="comment-form-actions">
                  <button type="submit" className="comment-submit-btn">
                    Post Comment
                  </button>
                  <button 
                    type="button" 
                    className="comment-cancel-btn"
                    onClick={() => setShowCommentForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-name">{comment.name}</span>
                    <span className="comment-date">{formatCommentDate(comment.date || comment.createdAt)}</span>
                  </div>
                  <p className="comment-text">{comment.text || comment.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>

    <Footer />
  </div>
);
};

// Simple Header Component
const Header = () => {
  const navigate = useNavigate();
  
  return (
    <header className="pub-detail-header-nav">
      <div className="pub-detail-header-content">
        <div 
          className="pub-detail-brand" 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            navigate("/");
          }}
        >
          PublishHub
        </div>
        <nav className="pub-detail-nav">
          <button 
            className="pub-detail-nav-btn"
            onClick={() => navigate('/')}
          >
            Home
          </button>
          <button 
            className="pub-detail-nav-btn"
            onClick={() => navigate('/page/publicArticlesPage')}
          >
            Articles
          </button>
        </nav>
      </div>
    </header>
  );
};




// Simple Footer Component
const Footer = () => {
  return (
    <footer className="pub-detail-footer-nav">
      <p>© 2026 PublishHub. All rights reserved.</p>
    </footer>
  );
};

export default ArticleDetailPublicView;