import axios from 'axios';

const ARTICLE_API_URL = 'http://localhost:5000/api/articles';

// ==================== ARTICLE ENDPOINTS ====================

// Get all published articles from all authors (public - no token needed)
export const getPublishedArticles = async () => {
  try {
    const response = await axios.get(`${ARTICLE_API_URL}/public`);
    return response.data.articles;
  } catch (error) {
    console.error('Error fetching published articles:', error);
    throw error;
  }
};

// Get a single published article by ID (public - no token needed)
export const getPublicArticleById = async (id) => {
  try {
    const response = await axios.get(`${ARTICLE_API_URL}/public/${id}`);
    return response.data.article;
  } catch (error) {
    console.error(`Error fetching published article with id ${id}:`, error);
    throw error;
  }
};

// ==================== LIKE ENDPOINTS ====================

// Toggle like on an article
export const toggleLike = async (articleId, sessionId = null) => {
  try {
    // Generate or use provided session ID
    const session = sessionId || localStorage.getItem('sessionId') || 'session-' + Date.now();
    
    // Store session in localStorage if not already there
    if (!localStorage.getItem('sessionId')) {
      localStorage.setItem('sessionId', session);
    }
    
    const response = await axios.post(
      `${ARTICLE_API_URL}/public/${articleId}/like`,
      {}, // No body needed
      {
        headers: {
          'x-session-id': session
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// Get like status for current user
export const getLikeStatus = async (articleId) => {
  try {
    const session = localStorage.getItem('sessionId') || 'session-' + Date.now();
    
    const response = await axios.get(
      `${ARTICLE_API_URL}/public/${articleId}/like/status`,
      {
        headers: {
          'x-session-id': session
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting like status:', error);
    throw error;
  }
};

// Get likes count for an article
export const getLikesCount = async (articleId) => {
  try {
    const response = await axios.get(`${ARTICLE_API_URL}/public/${articleId}/like/count`);
    return response.data;
  } catch (error) {
    console.error('Error getting likes count:', error);
    throw error;
  }
};

// ==================== COMMENT ENDPOINTS ====================

// Create a new comment
export const createComment = async (articleId, name, comment) => {
  try {
    const session = localStorage.getItem('sessionId') || 'session-' + Date.now();
    
    // Store session in localStorage if not already there
    if (!localStorage.getItem('sessionId')) {
      localStorage.setItem('sessionId', session);
    }
    
    const response = await axios.post(
      `${ARTICLE_API_URL}/public/${articleId}/comments`,
      { name, comment },
      {
        headers: {
          'x-session-id': session,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// Get all comments for an article
export const getArticleComments = async (articleId) => {
  try {
    const response = await axios.get(`${ARTICLE_API_URL}/public/${articleId}/comments`);
    return response.data.comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// Helper function to generate or get session ID
export const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};