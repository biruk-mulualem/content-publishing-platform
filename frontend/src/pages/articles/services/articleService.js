import axios from 'axios';

const ARTICLE_API_URL = 'http://localhost:5000/api/articles';

// Create article
export const createArticle = async (articleData, token) => {
  const response = await axios.post(`${ARTICLE_API_URL}/create`, articleData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return response.data.article;
};

// Get all articles for current user (protected)
export const getArticles = async (token) => {
  const response = await axios.get(ARTICLE_API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.articles;
};



// Get single article (protected)
export const getArticleById = async (id, token) => {
  const response = await axios.get(`${ARTICLE_API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.article;
};

// Update article
export const updateArticle = async (id, updatedData, token) => {
  const response = await axios.put(`${ARTICLE_API_URL}/${id}`, updatedData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return response.data.article;
};

// Delete article
export const deleteArticle = async (id, token) => {
  const response = await axios.delete(`${ARTICLE_API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.message;
};

// Toggle publish
export const togglePublishStatus = async (id, token) => {
  const response = await axios.patch(`${ARTICLE_API_URL}/${id}/publish`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.article;
};