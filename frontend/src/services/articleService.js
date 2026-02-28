import api from './interceptor';

// ==================== ARTICLE CRUD ====================

// Get all articles for current user
export const getArticles = async () => {
  try {
    const response = await api.get('/articles');
    return response.data?.articles || [];
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error; // Let component handle the error
  }
};

// Get single article by ID
export const getArticleById = async (id) => {
  try {
    const response = await api.get(`/articles/${id}`);
    return response.data?.article || null;
  } catch (error) {
    console.error(`Error fetching article ${id}:`, error);
    throw error;
  }
};

// Create new article
export const createArticle = async (articleData) => {
  try {
    const response = await api.post('/articles', articleData);
    return response.data?.article || null;
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
};

// Update article
export const updateArticle = async (id, updatedData) => {
  try {
    const response = await api.put(`/articles/${id}`, updatedData);
    return response.data?.article || null;
  } catch (error) {
    console.error(`Error updating article ${id}:`, error);
    throw error;
  }
};

// Delete article
export const deleteArticle = async (id) => {
  try {
    const response = await api.delete(`/articles/${id}`);
    return response.data?.message || 'Article deleted successfully';
  } catch (error) {
    console.error(`Error deleting article ${id}:`, error);
    throw error;
  }
};

// Toggle publish status
export const togglePublishStatus = async (id) => {
  try {
    const response = await api.patch(`/articles/${id}/publish`, {});
    return response.data?.article || null;
  } catch (error) {
    console.error(`Error toggling publish status for ${id}:`, error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS (Pure JS) ====================

// Get only published articles
export const getPublishedArticles = (articles = []) => {
  if (!Array.isArray(articles)) return [];
  return articles.filter(article => article?.published_status === 1);
};

// Get only draft articles
export const getDraftArticles = (articles = []) => {
  if (!Array.isArray(articles)) return [];
  return articles.filter(article => article?.published_status === 0);
};

// Sort articles by date (newest first)
export const sortArticlesByDate = (articles = []) => {
  if (!Array.isArray(articles)) return [];
  return [...articles].sort((a, b) => 
    new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
  );
};

// Search articles by title or content
export const searchArticles = (articles = [], searchTerm = '') => {
  if (!Array.isArray(articles) || !searchTerm) return articles;
  const term = searchTerm.toLowerCase();
  return articles.filter(article => 
    article?.title?.toLowerCase().includes(term) ||
    article?.content?.toLowerCase().includes(term)
  );
};

// Get articles count by status
export const getArticlesCount = (articles = []) => {
  if (!Array.isArray(articles)) return { total: 0, published: 0, drafts: 0 };
  
  const published = articles.filter(a => a?.published_status === 1).length;
  const drafts = articles.filter(a => a?.published_status === 0).length;
  
  return {
    total: articles.length,
    published,
    drafts
  };
};