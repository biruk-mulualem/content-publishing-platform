import api from './interceptor'; 

// ==================== ARTICLE CRUD ====================

// Get all articles for the current user
export const getUserArticles = async () => {
  try {
    const response = await api.get('/articles');
    return response.data.articles || [];
  } catch (error) {
    console.error('Error fetching user articles:', error);
    throw error;
  }
};

// Get single article by ID
export const getArticleById = async (id) => {
  try {
    const response = await api.get(`/articles/${id}`);
    return response.data.article;
  } catch (error) {
    console.error(`Error fetching article ${id}:`, error);
    throw error;
  }
};

// Create new article
export const createArticle = async (articleData) => {
  try {
    const response = await api.post('/articles', articleData);
    return response.data;
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
};

// Update article
export const updateArticle = async (id, articleData) => {
  try {
    const response = await api.put(`/articles/${id}`, articleData);
    return response.data;
  } catch (error) {
    console.error(`Error updating article ${id}:`, error);
    throw error;
  }
};

// Delete article
export const deleteArticle = async (id) => {
  try {
    const response = await api.delete(`/articles/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting article ${id}:`, error);
    throw error;
  }
};

// Toggle publish status
export const togglePublishStatus = async (id) => {
  try {
    const response = await api.patch(`/articles/${id}/publish`, {});
    return response.data;
  } catch (error) {
    console.error(`Error toggling publish status for ${id}:`, error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS (no API calls) ====================

// Get recent articles (sorted by date)
export const getRecentArticles = (articles, limit = 5) => {
  return [...articles]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};

// Get popular articles (by likes)
export const getPopularArticles = (articles, limit = 3) => {
  return [...articles]
    .filter(a => a.published_status === 1)
    .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
    .slice(0, limit);
};