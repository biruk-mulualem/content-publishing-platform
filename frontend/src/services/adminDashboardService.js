// services/adminService.js

import api from './interceptor'; 




// ==================== STATS ENDPOINTS ====================

export const getArticleStats = async () => {
  try {
    const response = await api.get(`/admin/stats/articles`);
    return response.data;
  } catch (error) {
    console.error('Error fetching article stats:', error);
    throw error;
  }
};

export const getAuthorStats = async () => {
  try {
    const response = await api.get(`/admin/stats/authors`);
    return response.data;
  } catch (error) {
    console.error('Error fetching author stats:', error);
    throw error;
  }
};

export const getLikeStats = async () => {
  try {
    const response = await api.get(`/admin/stats/likes`);
    return response.data;
  } catch (error) {
    console.error('Error fetching like stats:', error);
    throw error;
  }
};

export const getCommentStats = async () => {
  try {
    const response = await api.get(`/admin/stats/comments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    throw error;
  }
};

export const getTagStats = async () => {
  try {
    const response = await api.get(`/admin/stats/tags`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tag stats:', error);
    throw error;
  }
};

// ==================== AUTHORS DATA ====================

export const getTopAuthors = async (limit = 5) => {
  try {
    const response = await api.get(`/admin/authors/top?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching top authors:', error);
    throw error;
  }
};

export const getAllAuthors = async () => {
  try {
    const response = await api.get(`/admin/authors`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all authors:', error);
    throw error;
  }
};

// ==================== ACTIVITY ====================

export const getRecentActivity = async (limit = 10) => {
  try {
    const response = await api.get(`/admin/activity/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
};

// ==================== TAGS ====================

export const getPopularTags = async (limit = 10) => {
  try {
    const response = await api.get(`/admin/tags/popular?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    throw error;
  }
};

// ==================== CHARTS ====================

export const getDailyStats = async (days = 7) => {
  try {
    const response = await api.get(`/admin/charts/daily?days=${days}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    throw error;
  }
};

// ==================== COMBINED DASHBOARD DATA ====================

export const adminDashboardService = async () => {
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