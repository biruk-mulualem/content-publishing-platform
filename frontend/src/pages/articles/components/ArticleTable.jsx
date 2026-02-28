// components/ArticleTable.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { deleteArticle, togglePublishStatus } from "../../../services/articleService";
import ArticleModals from "./ArticleModals.jsx";  // <---- IMPORT ADDED

const ArticleTable = ({ 
  articles, 
  filtered, 
  setArticles, 
  setFiltered, 
  setError, 
  error,
  token, 
  currentUserId 
}) => {
  const navigate = useNavigate();
  
  // ============ PAGINATION STATE & LOGIC ============
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Modal states for delete/publish (these trigger modals in ArticleModals)
  const [deleteModal, setDeleteModal] = useState(null);
  const [publishModal, setPublishModal] = useState(null);
  const [editModal, setEditModal] = useState(null); // For edit, we'll pass to modals
  
  // Loading states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  // ============ HELPER FUNCTIONS ============
  const getBodyPreview = (htmlContent, wordCount = 8) => {
    if (!htmlContent) return "No content";
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    const words = textContent.trim().split(/\s+/);
    const preview = words.slice(0, wordCount).join(' ');
    return words.length > wordCount ? preview + '...' : preview;
  };

  const getLimitedTags = (tags, limit = 2) => {
    if (!tags || tags.length === 0) return [];
    if (tags.length <= limit) return tags;
    return [...tags.slice(0, limit), `+${tags.length - limit}`];
  };

  // ============ PAGINATION LOGIC ============
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = getCurrentPageItems();

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filtered.length]);

  // ============ ACTION HANDLERS ============
  const handleEdit = (article) => {
    setEditModal({
      ...article,
      tagsInput: article.tags.join(", "),
      editBody: article.body || ""
    });
  };

  const handleDelete = async (article) => {
    setError("");
    
    if (article.authorId !== currentUserId) {
      setError("You don't have permission to delete this article.");
      setDeleteModal(null);
      return;
    }
    
    if (!article || !article.id) {
      setError("Article not found.");
      setDeleteModal(null);
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteArticle(article.id, token);
      setArticles(prev => prev.filter(a => a.id !== article.id));
      setFiltered(prev => prev.filter(a => a.id !== article.id));
      setDeleteModal(null);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setError("Article already deleted or not found.");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to delete this article.");
      } else {
        setError("Failed to delete article. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (article) => {
    setError("");
    
    if (article.authorId !== currentUserId) {
      setError("You don't have permission to modify this article.");
      setPublishModal(null);
      return;
    }
    
    if (!article || !article.id) {
      setError("Article not found.");
      setPublishModal(null);
      return;
    }
    
    if (article.published_status === 0) {
      if (!article.title || article.title.trim().length < 3) {
        setError("Cannot publish: Article title must be at least 3 characters.");
        setPublishModal(null);
        return;
      }
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = article.body || "";
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      
      if (!textContent.trim() || textContent.trim().length < 10) {
        setError("Cannot publish: Article content must be at least 10 characters.");
        setPublishModal(null);
        return;
      }
      
      if (article.tags && article.tags.length > 0) {
        if (article.tags.length > 10) {
          setError("Cannot publish: Maximum 10 tags allowed.");
          setPublishModal(null);
          return;
        }
        
        for (const tag of article.tags) {
          if (tag.length < 2 || tag.length > 30) {
            setError("Cannot publish: Each tag must be between 2-30 characters.");
            setPublishModal(null);
            return;
          }
        }
      }
    }
    
    setIsTogglingPublish(true);
    try {
      const updatedArticle = await togglePublishStatus(article.id, token);
      
      const normalizedArticle = {
        ...updatedArticle,
        tags: typeof updatedArticle.tags === "string" 
          ? updatedArticle.tags.split(",").map(t => t.trim()).filter(t => t)
          : updatedArticle.tags || [],
        authorName: updatedArticle.authorName || article.authorName,
        authorId: updatedArticle.authorId !== undefined ? Number(updatedArticle.authorId) : article.authorId,
        bodyPreview: article.bodyPreview
      };

      setArticles(prev => prev.map(a => a.id === article.id ? normalizedArticle : a));
      setFiltered(prev => prev.map(a => a.id === article.id ? normalizedArticle : a));
      setPublishModal(null);
    } catch (err) {
      console.error(err);
      setError("Failed to update publish status.");
    } finally {
      setIsTogglingPublish(false);
    }
  };

  // ============ PAGINATION COMPONENT ============
  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button 
          className="pagination-btn prev"
          onClick={() => {
            setCurrentPage(prev => Math.max(prev - 1, 1));
            document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          disabled={currentPage === 1}
        >
          <span className="btn-icon">←</span>
        </button>
        
        <div className="page-info">
          <span className="current-page">{currentPage}</span>
          <span className="separator">/</span>
          <span className="total-pages">{totalPages}</span>
        </div>
        
        <button 
          className="pagination-btn next"
          onClick={() => {
            setCurrentPage(prev => Math.min(prev + 1, totalPages));
            document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          disabled={currentPage === totalPages}
        >
          <span className="btn-icon">→</span>
        </button>
      </div>
    );
  };

  // ============ RENDER ============
  if (filtered.length === 0) {
    return (
      <>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Content Preview</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5" className="no-results">
                  <div className="no-results-content">
                    <span className="no-results-icon">🔍</span>
                    <p>No articles found matching your filters</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination />
      </>
    );
  }

  return (
    <>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Content Preview</th>
              <th>Status</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(article => {
              const displayTags = getLimitedTags(article.tags, 2);
              
              return (
                <tr key={article.id}>
                  <td className="title-cell">{article.title}</td>
                  <td className="preview-cell">
                    <div className="content-preview">
                      {getBodyPreview(article.body, 8)}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${article.published_status === 1 ? 'published' : 'draft'}`}>
                      {article.published_status === 1 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="tags-container">
                      {displayTags.map((tag, index) => (
                        <span key={index} className={`tag-badge ${tag.startsWith('+') ? 'more-tag' : ''}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="actions">
                    <div className="action-buttons">
                      <button
                        className="action-btn detail"
                        onClick={() => navigate(`/articles/${article.id}`)}
                      >
                        <span className="tooltip">Detail</span>
                      </button>

                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(article)}
                      >
                        <span className="tooltip">Edit</span>
                      </button>

                      <button
                        className="action-btn delete"
                        onClick={() => setDeleteModal(article)}
                      >
                        <span className="tooltip">Delete</span>
                      </button>

                      <button
                        className={`action-btn publish ${article.published_status === 1 ? "unpublish" : "publish-active"}`}
                        onClick={() => setPublishModal(article)}
                      >
                        <span className="tooltip">
                          {article.published_status === 1 ? "Unpublish" : "Publish"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination />

      {/* These will be picked up by ArticleModals component */}
      {deleteModal && (
        <ArticleModals
          type="delete"
          modalData={deleteModal}
          setModalData={setDeleteModal}
          onConfirm={handleDelete}
          isConfirming={isDeleting}
          error={error}
          setError={setError}
        />
      )}

      {publishModal && (
        <ArticleModals
          type="publish"
          modalData={publishModal}
          setModalData={setPublishModal}
          onConfirm={handlePublish}
          isConfirming={isTogglingPublish}
          error={error}
          setError={setError}
        />
      )}

      {editModal && (
        <ArticleModals
          type="edit"
          modalData={editModal}
          setModalData={setEditModal}
          articles={articles}
          setArticles={setArticles}
          setFiltered={setFiltered}
          token={token}
          currentUserId={currentUserId}
          setError={setError}
          error={error}
        />
      )}
    </>
  );
};

export default ArticleTable;