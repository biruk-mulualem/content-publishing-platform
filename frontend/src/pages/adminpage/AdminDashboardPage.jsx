// pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/shared/header/Header';
import './AdminDashboardPage.css';
import { adminDashboardService,getAllAuthors } from '../../services/adminDashboardService';


const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalArticles: 0,
      totalAuthors: 0,
      totalLikes: 0,
      totalComments: 0,
      publishedArticles: 0,
      draftArticles: 0,
      totalTags: 0,
      articlesWithComments: 0,
      avgLikesPerArticle: 0,
      avgCommentsPerArticle: 0
    },
    topAuthors: [],
    recentActivity: [],
    popularTags: [],
    chartData: {
      dailyArticles: [],
      dailyLikes: [],
      dailyComments: []
    }
  });

  // New state for all authors table
  const [allAuthors, setAllAuthors] = useState([]);
  const [filteredAuthors, setFilteredAuthors] = useState([]);
  const [authorsLoading, setAuthorsLoading] = useState(false);
  const [authorSearch, setAuthorSearch] = useState('');
  const [authorPagination, setAuthorPagination] = useState({
    currentPage: 1,
    itemsPerPage: 5,
    totalPages: 1
  });

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName');

  useEffect(() => {
    // Check if user is admin - redirect to home instead of alert
    if (userRole !== 'admin') {
      navigate('/');
      return;
    }

    fetchAdminDashboardData();
    fetchAllAuthors();
  }, []);

  // Filter authors when search changes
  useEffect(() => {
    if (allAuthors.length > 0) {
      const filtered = allAuthors.filter(author => 
        author.name.toLowerCase().includes(authorSearch.toLowerCase()) ||
        author.email.toLowerCase().includes(authorSearch.toLowerCase()) ||
        (author.role && author.role.toLowerCase().includes(authorSearch.toLowerCase()))
      );
      setFilteredAuthors(filtered);
      setAuthorPagination(prev => ({
        ...prev,
        totalPages: Math.ceil(filtered.length / prev.itemsPerPage),
        currentPage: 1
      }));
    }
  }, [authorSearch, allAuthors]);

  const fetchAdminDashboardData = async () => {
    setLoading(true);
    try {
      const data = await adminDashboardService();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAuthors = async () => {
    setAuthorsLoading(true);
    try {
      const authors = await getAllAuthors();
      setAllAuthors(authors);
      setFilteredAuthors(authors);
      setAuthorPagination({
        currentPage: 1,
        itemsPerPage: 12,
        totalPages: Math.ceil(authors.length / 5)
      });
    } catch (err) {
      console.error('Error fetching all authors:', err);
    } finally {
      setAuthorsLoading(false);
    }
  };

  // Get current page authors
  const getCurrentPageAuthors = () => {
    const start = (authorPagination.currentPage - 1) * authorPagination.itemsPerPage;
    const end = start + authorPagination.itemsPerPage;
    return filteredAuthors.slice(start, end);
  };

  // Handle author search
  const handleAuthorSearch = (e) => {
    setAuthorSearch(e.target.value);
  };

  // Handle author pagination
  const goToAuthorPage = (page) => {
    setAuthorPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-wrapper">
        <Header />
        <div className="admin-layout">
          <main className="admin-content">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading admin dashboard...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-wrapper">
        <Header />
        <div className="admin-layout">
          <main className="admin-content">
            <div className="error-container">
              <span className="error-icon">⚠️</span>
              <h2>Error</h2>
              <p>{error}</p>
              <button onClick={fetchAdminDashboardData} className="retry-btn">
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { stats, topAuthors, recentActivity, popularTags, chartData } = dashboardData;
  const currentAuthors = getCurrentPageAuthors();

  return (
    <div className="admin-wrapper">
      <Header />
      <div className="admin-layout">
        <main className="admin-content">
          {/* Role Badge */}
          

          <div className="admin-header">
            <h1>Admin Dashboard</h1>
            <p className="admin-subtitle">System overview and analytics</p>
          </div>

          {/* Key Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card articles">
              <div className="metric-icon">📄</div>
              <div className="metric-content">
                <h3>Total Articles</h3>
                <p className="metric-number">{stats.totalArticles.toLocaleString()}</p>
                <div className="metric-breakdown">
                  <span className="published">Published: {stats.publishedArticles}</span>
                  <span className="draft">Drafts: {stats.draftArticles}</span>
                </div>
              </div>
            </div>

            <div className="metric-card authors">
              <div className="metric-icon">👥</div>
              <div className="metric-content">
                <h3>Total Authors</h3>
                <p className="metric-number">{stats.totalAuthors.toLocaleString()}</p>
                <p className="metric-sub">Active content creators</p>
              </div>
            </div>

            <div className="metric-card likes">
              <div className="metric-icon">❤️</div>
              <div className="metric-content">
                <h3>Total Likes</h3>
                <p className="metric-number">{stats.totalLikes.toLocaleString()}</p>
                <p className="metric-sub">Avg {stats.avgLikesPerArticle} per article</p>
              </div>
            </div>

            <div className="metric-card comments">
              <div className="metric-icon">💬</div>
              <div className="metric-content">
                <h3>Total Comments</h3>
                <p className="metric-number">{stats.totalComments.toLocaleString()}</p>
                <p className="metric-sub">
                  {stats.articlesWithComments} articles have comments
                </p>
              </div>
            </div>
          </div>

          {/* Data Tables Row - Replaces Charts */}
          <div className="data-tables-row">
            {/* Daily Articles Table */}
            <div className="table-card">
              <h3>Daily Articles (Last 7 Days)</h3>
              <table className="admin-table compact">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Articles Published</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.dailyArticles?.map((day, index) => (
                    <tr key={index}>
                      <td>{day.date}</td>
                      <td>
                        <span className="count-badge">{day.count}</span>
                      </td>
                    </tr>
                  ))}
                  {(!chartData.dailyArticles || chartData.dailyArticles.length === 0) && (
                    <tr>
                      <td colSpan="2" className="no-data">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Daily Engagement Table */}
            <div className="table-card">
              <h3>Daily Engagement (Last 7 Days)</h3>
              <table className="admin-table compact">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Likes</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.dailyLikes?.map((day, index) => (
                    <tr key={index}>
                      <td>{day.date}</td>
                      <td>
                        <span className="likes-badge">❤️ {day.count}</span>
                      </td>
                      <td>
                        <span className="comments-badge">💬 {chartData.dailyComments?.[index]?.count || 0}</span>
                      </td>
                    </tr>
                  ))}
                  {(!chartData.dailyLikes || chartData.dailyLikes.length === 0) && (
                    <tr>
                      <td colSpan="3" className="no-data">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tables Row */}
          <div className="tables-row">
            {/* Top Authors */}
            <div className="table-card">
              <h3>Top Authors</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Author</th>
                    <th>Articles</th>
                    <th>Likes</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {topAuthors.map(author => (
                    <tr key={author.id}>
                      <td className="author-cell">
                        <span className="author-avatar">{author.avatar || '👤'}</span>
                        <span className="author-name">{author.name}</span>
                      </td>
                      <td>{author.articleCount}</td>
                      <td>
                        <span className="likes-badge">❤️ {author.totalLikes}</span>
                      </td>
                      <td>
                        <span className="comments-badge">💬 {author.totalComments}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Popular Tags */}
            <div className="table-card">
              <h3>Popular Tags</h3>
              <div className="tags-cloud">
                {popularTags.map(tag => (
                  <div key={tag.name} className="tag-item">
                    <span className="tag-name">#{tag.name}</span>
                    <span className="tag-count">{tag.count} articles</span>
                    <div className="tag-bar" style={{ width: `${tag.percentage}%` }}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Two Column Layout for Recent Activity and All Authors */}
          <div className="two-column-layout">
            {/* Recent Activity */}
            <div className="activity-card">
              <h3>Recent Activity</h3>
              <div className="activity-timeline">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-time">{formatDate(activity.time)}</div>
                    <div className="activity-content">
                      <span className={`activity-badge ${activity.type}`}>
                        {activity.type === 'article' && '📄'}
                        {activity.type === 'comment' && '💬'}
                        {activity.type === 'like' && '❤️'}
                        {activity.type === 'user' && '👤'}
                      </span>
                      <div className="activity-details">
                        <p>
                          <strong>{activity.user}</strong> {activity.action}
                          {activity.target && (
                            <span className="activity-target"> "{activity.target}"</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All Authors Table with Search and Pagination */}
            <div className="authors-table-card">
              <div className="card-header">
                <h3>All Authors</h3>
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search authors..."
                    value={authorSearch}
                    onChange={handleAuthorSearch}
                    className="search-input"
                  />
                </div>
              </div>

              {authorsLoading ? (
                <div className="mini-loading">Loading authors...</div>
              ) : (
                <>
                  <table className="admin-table authors-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Articles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAuthors.length > 0 ? (
                        currentAuthors.map(author => (
                          <tr key={author.id}>
                            <td className="author-name-cell">
                              <span className="author-avatar-small">{author.avatar || '👤'}</span>
                              {author.name}
                            </td>
                            <td>{author.email}</td>
                            <td>
                              <span className={`role-badge-small ${author.role}`}>
                                {author.role}
                              </span>
                            </td>
                            <td>{formatJoinDate(author.joinedAt)}</td>
                            <td>{author.articleCount || 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="no-data">No authors found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {filteredAuthors.length > 0 && (
                    <div className="authors-pagination">
                      <button
                        onClick={() => goToAuthorPage(authorPagination.currentPage - 1)}
                        disabled={authorPagination.currentPage === 1}
                        className="pagination-btn-small"
                      >
                        ← Prev
                      </button>
                      <span className="pagination-info">
                        Page {authorPagination.currentPage} of {authorPagination.totalPages}
                      </span>
                      <button
                        onClick={() => goToAuthorPage(authorPagination.currentPage + 1)}
                        disabled={authorPagination.currentPage === authorPagination.totalPages}
                        className="pagination-btn-small"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;