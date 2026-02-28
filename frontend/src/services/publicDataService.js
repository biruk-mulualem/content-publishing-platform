import api from './interceptor';

// Helper function for session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// ==================== PUBLIC ARTICLE ENDPOINTS ====================

// Get all published articles (public)
export const getPublishedArticles = async () => {
  try {
    const response = await api.get('/articles/public');
    return response.data?.articles || [];
  } catch (error) {
    console.error('Error fetching published articles:', error);
    return []; // Return empty array instead of throwing
  }
};

// Get a single published article by ID
export const getPublicArticleById = async (id) => {
  try {
    const response = await api.get(`/articles/public/${id}`);
    return response.data?.article || null;
  } catch (error) {
    console.error(`Error fetching published article with id ${id}:`, error);
    return null;
  }
};

// ==================== LIKE ENDPOINTS ====================

// Toggle like on an article
export const toggleLike = async (articleId) => {
  try {
    const sessionId = getSessionId();
    
    const response = await api.post(
      `/articles/public/${articleId}/like`,
      {}, // No body needed
      {
        headers: {
          'x-session-id': sessionId
        }
      }
    );
    return response.data || { liked: false, count: 0 };
  } catch (error) {
    console.error('Error toggling like:', error);
    return { liked: false, count: 0 };
  }
};

// Get like status for current user
export const getLikeStatus = async (articleId) => {
  try {
    const sessionId = getSessionId();
    
    const response = await api.get(
      `/articles/public/${articleId}/like/status`,
      {
        headers: {
          'x-session-id': sessionId
        }
      }
    );
    return response.data || { liked: false };
  } catch (error) {
    console.error('Error getting like status:', error);
    return { liked: false };
  }
};

// Get likes count for an article
export const getLikesCount = async (articleId) => {
  try {
    const response = await api.get(`/articles/public/${articleId}/like/count`);
    return response.data || { count: 0 };
  } catch (error) {
    console.error('Error getting likes count:', error);
    return { count: 0 };
  }
};

// ==================== COMMENT ENDPOINTS ====================

// Create a new comment
export const createComment = async (articleId, name, comment) => {
  try {
    const sessionId = getSessionId();
    
    const response = await api.post(
      `/articles/public/${articleId}/comments`,
      { name, comment },
      {
        headers: {
          'x-session-id': sessionId
        }
      }
    );
    return response.data || { success: true };
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error; // Let component handle this
  }
};

// Get all comments for an article
export const getArticleComments = async (articleId) => {
  try {
    const response = await api.get(`/articles/public/${articleId}/comments`);
    return response.data?.comments || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

// ==================== EXPORT SESSION HELPER ====================

export { getSessionId };