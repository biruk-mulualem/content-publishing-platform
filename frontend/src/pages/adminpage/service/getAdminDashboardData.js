// services/adminService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// ==================== STATS ENDPOINTS ====================

export const getArticleStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats/articles`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching article stats:', error);
    throw error;
  }
};

export const getAuthorStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats/authors`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching author stats:', error);
    throw error;
  }
};

export const getLikeStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats/likes`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching like stats:', error);
    throw error;
  }
};

export const getCommentStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats/comments`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    throw error;
  }
};

export const getTagStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats/tags`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching tag stats:', error);
    throw error;
  }
};

// ==================== AUTHORS DATA ====================

export const getTopAuthors = async (limit = 5) => {
  try {
    const response = await axios.get(`${API_URL}/authors/top?limit=${limit}`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching top authors:', error);
    throw error;
  }
};

export const getAllAuthors = async () => {
  try {
    const response = await axios.get(`${API_URL}/authors`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching all authors:', error);
    throw error;
  }
};

// ==================== ACTIVITY ====================

export const getRecentActivity = async (limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/activity/recent?limit=${limit}`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
};

// ==================== TAGS ====================

export const getPopularTags = async (limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/tags/popular?limit=${limit}`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    throw error;
  }
};

// ==================== CHARTS ====================

export const getDailyStats = async (days = 7) => {
  try {
    const response = await axios.get(`${API_URL}/charts/daily?days=${days}`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    throw error;
  }
};

// ==================== COMBINED DASHBOARD DATA ====================

export const getAdminDashboardData = async () => {
  try {
    const [
      articleStats,
      authorStats,
      likeStats,
      commentStats,
      tagStats,
      topAuthors,
      recentActivity,
      popularTags,
      dailyStats
    ] = await Promise.all([
      getArticleStats(),
      getAuthorStats(),
      getLikeStats(),
      getCommentStats(),
      getTagStats(),
      getTopAuthors(5),
      getRecentActivity(10),
      getPopularTags(10),
      getDailyStats(7)
    ]);

    // Calculate averages
    const totalArticles = articleStats.total || 0;
    const totalLikes = likeStats.total || 0;
    const totalComments = commentStats.total || 0;

    return {
      stats: {
        totalArticles,
        totalAuthors: authorStats.total || 0,
        totalLikes,
        totalComments,
        publishedArticles: articleStats.published || 0,
        draftArticles: articleStats.drafts || 0,
        totalTags: tagStats.total || 0,
        articlesWithComments: commentStats.articlesWithComments || 0,
        avgLikesPerArticle: totalArticles > 0 ? (totalLikes / totalArticles).toFixed(1) : 0,
        avgCommentsPerArticle: totalArticles > 0 ? (totalComments / totalArticles).toFixed(1) : 0
      },
      topAuthors,
      recentActivity,
      popularTags: popularTags.tags || [],
      chartData: dailyStats
    };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    throw error;
  }
};