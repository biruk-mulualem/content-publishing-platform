import React, { useEffect, useState } from "react";
import "./DashboardPage.css";
import { useNavigate } from "react-router-dom";
import Header from "../../components/shared/header/Header.jsx";
import { 
  getUserArticles, 
  createArticle,
  getRecentArticles,
  getPopularArticles
} from "./service/dashboardService.js";

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalArticles: 0,
    published: 0,
    drafts: 0,
    totalLikes: 0,
    totalComments: 0
  });

  const navigate = useNavigate();
  const [recentArticles, setRecentArticles] = useState([]);
  const [popularArticles, setPopularArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    tags: "",
  });
  const [error, setError] = useState("");
  const [author, setAuthor] = useState({
    name: "",
    avatar: "👨‍💻",
    bio: "",
    articlesCount: 0
  });

  // Get token from localStorage
  const token = localStorage.getItem("token");







// Add this function to decode user info from token
// Add this function to get user info from login response
const getUserFromStorage = () => {
  // Since the token doesn't contain the name, we need to get it from login response
  // You can store it in localStorage during login
  
  // Try to get from localStorage (you need to store it during login)
  const storedName = localStorage.getItem('userName');
  if (storedName) {
    return { name: storedName };
  }
  
  // If not stored, try to get from token (but it only has userId and email)
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      console.log("Token payload:", payload); // This will show only userId and email
      
      // Token only has userId and email, no name
      return { 
        name: "Author", // Default since token doesn't have name
        email: payload.email 
      };
    } catch (e) {
      console.error("Error decoding token:", e);
      return { name: "Author" };
    }
  }
  return { name: "Author" };
};







  // Fetch dashboard data
 useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user info from token first
      const userInfo = getUserFromStorage();
      setAuthor({
        name: userInfo.name,
        avatar: "👨‍💻",
        bio: "Content creator",
        articlesCount: 0
      });
      
      // Fetch user's articles
      const response = await getUserArticles();
      
      // Handle both old and new response formats
      const articles = response.articles || response;
      const authorTotals = response.authorTotals || null;
      
      if (authorTotals) {
        setStats({
          totalArticles: authorTotals.totalArticles,
          published: authorTotals.publishedCount,
          drafts: authorTotals.draftCount,
          totalLikes: authorTotals.totalLikes,
          totalComments: authorTotals.totalComments
        });
      } else {
        const published = articles.filter(a => a.published_status === 1).length;
        const drafts = articles.filter(a => a.published_status === 0).length;
        const totalLikes = articles.reduce((sum, a) => sum + (a.likesCount || 0), 0);
        const totalComments = articles.reduce((sum, a) => sum + (a.commentsCount || 0), 0);
        
        setStats({
          totalArticles: articles.length,
          published,
          drafts,
          totalLikes,
          totalComments
        });
      }

      setRecentArticles(getRecentArticles(articles, 5));

      const popular = [...articles]
        .filter(a => a.published_status === 1)
        .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
        .slice(0, 3);
      setPopularArticles(popular);

      // Update author info with actual article count
      if (articles.length > 0) {
        const firstArticle = articles[0];
        setAuthor(prev => ({
          ...prev,
          name: firstArticle.authorName || prev.name,
          articlesCount: articles.length
        }));
      } else {
        // If no articles, just update the count (name already set from token)
        setAuthor(prev => ({
          ...prev,
          articlesCount: 0
        }));
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Still keep the name from token even if API fails
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    fetchDashboardData();
  } else {
    navigate("/page/loginpage");
  }
}, [token, navigate]);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      setError("Title and body are required.");
      return;
    }

    try {
      const articleData = {
        title: formData.title,
        body: formData.body,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      const response = await createArticle(articleData);
      const newArticle = response.article;

      setRecentArticles([newArticle, ...recentArticles].slice(0, 5));
      
      setStats({
        ...stats,
        totalArticles: stats.totalArticles + 1,
        drafts: stats.drafts + 1
      });

      setAuthor({
        ...author,
        articlesCount: author.articlesCount + 1
      });

      setShowModal(false);
      setFormData({ title: "", body: "", tags: "" });
      setError("");
      
    } catch (error) {
      console.error("Error creating article:", error);
      setError(error.response?.data?.error || "Failed to create article");
    }
  };

  // Calculate percentages
  const publishedPercentage = stats.totalArticles > 0 
    ? (stats.published / stats.totalArticles * 100).toFixed(1) 
    : 0;
  const draftPercentage = stats.totalArticles > 0 
    ? (stats.drafts / stats.totalArticles * 100).toFixed(1) 
    : 0;

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <Header onCreateArticle={() => setShowModal(true)} />
        <div className="dashboard-layout">
          <main className="dashboard-content">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading your author dashboard...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Header onCreateArticle={() => setShowModal(true)} />

      <div className="dashboard-layout">
        <main className="dashboard-content">
          {/* Author Profile Header */}
          <div className="author-header">
            <div className="author-avatar">{author.avatar}</div>
            <div className="author-info">
              <h1>{author.name}'s Dashboard</h1>
              <p className="author-bio">{author.bio}</p>
              <div className="author-meta">
                <span>📝 {author.articlesCount} total articles</span>
                <span>❤️ {stats.totalLikes} total likes</span>
                <span>💬 {stats.totalComments} total comments</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">📄</div>
              <div className="stat-content">
                <h4>Total Articles</h4>
                <p className="stat-number">{stats.totalArticles}</p>
              </div>
            </div>

            <div className="stat-card published">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h4>Published</h4>
                <p className="stat-number">{stats.published}</p>
                <div className="stat-progress">
                  <div className="progress-bar" style={{ width: `${publishedPercentage}%` }}></div>
                </div>
              </div>
            </div>

            <div className="stat-card draft">
              <div className="stat-icon">✏️</div>
              <div className="stat-content">
                <h4>Drafts</h4>
                <p className="stat-number">{stats.drafts}</p>
                <div className="stat-progress">
                  <div className="progress-bar draft" style={{ width: `${draftPercentage}%` }}></div>
                </div>
              </div>
            </div>

            <div className="stat-card likes">
              <div className="stat-icon">❤️</div>
              <div className="stat-content">
                <h4>Total Likes</h4>
                <p className="stat-number">{stats.totalLikes}</p>
              </div>
            </div>

            <div className="stat-card comments">
              <div className="stat-icon">💬</div>
              <div className="stat-content">
                <h4>Total Comments</h4>
                <p className="stat-number">{stats.totalComments}</p>
              </div>
            </div>
          </div>

          {/* Charts and Tables Row */}
          <div className="dashboard-row">
            {/* Recent Articles */}
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
                      <th>Published</th>
                      <th>Likes</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentArticles.length > 0 ? (
                      recentArticles.slice(0, 4).map((article) => (
                        <tr key={article.id}>
                          <td className="article-title">{article.title}</td>
                          <td>
                            <span className={`badge ${article.published_status === 1 ? "published" : "draft"}`}>
                              {article.published_status === 1 ? "Published" : "Draft"}
                            </span>
                          </td>
                          <td>{new Date(article.createdAt).toLocaleDateString()}</td>
                          <td>{article.likesCount || 0}</td>
                          <td> {article.commentsCount || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-data">
                          No articles yet. Click "Write New" to create your first article!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Popular Articles */}
            <div className="popular-box">
              <div className="box-header">
                <h2>
                  <span className="header-icon">🔥</span>
                  Most Liked Articles
                </h2>
              </div>
              <div className="popular-list">
                {popularArticles.length > 0 ? (
                  popularArticles.map((article, index) => (
                    <div key={article.id} className="popular-item">
                      <div className="rank-badge">{index + 1}</div>
                      <div className="popular-content">
                        <h4>{article.title}</h4>
                        <div className="popular-meta">
                          <span> {article.likesCount || 0} likes</span>
                          <span>💬 {article.commentsCount || 0} comments</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    No published articles yet. Publish an article to see performance!
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Article Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Write New Article</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter article title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  name="body"
                  placeholder="Write your article content..."
                  rows="6"
                  value={formData.body}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  name="tags"
                  placeholder="Enter tags separated by commas (e.g., react, javascript, tutorial)"
                  value={formData.tags}
                  onChange={handleChange}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Create Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;