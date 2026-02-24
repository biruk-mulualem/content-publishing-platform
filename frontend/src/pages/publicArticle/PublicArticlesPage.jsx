import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./PublicArticlesPage.css";
import { getPublishedArticles } from "./service/publicDataService";

// Simple utility functions
const stripHtml = (html, maxLength = 120) => {
  if (!html) return "No content available";
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

const getReadTimeFromHtml = (html) => {
  if (!html) return "5 min read";
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  
  return `${readTime} min read`;
};

const PublicArticlesPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allTags, setAllTags] = useState([]);
  const [allAuthors, setAllAuthors] = useState([]);
  const [totalPublished, setTotalPublished] = useState(0);
  const [totalDrafts, setTotalDrafts] = useState(0);
  
  const articlesPerPage = 9;

  useEffect(() => {
    fetchAllArticles();
  }, []);

  useEffect(() => {
    filterAndSortArticles();
  }, [articles, searchTerm, selectedTag, selectedAuthor, sortBy]);

  const fetchAllArticles = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      console.log("Fetching articles with token:", token ? "Token exists" : "No token");
      
      const data = await getPublishedArticles(token);
      console.log("API Response:", data);
      console.log("Total articles from API:", data.length);
      
      // Count published vs drafts
      const published = data.filter(article => article.published_status === 1);
      const drafts = data.filter(article => article.published_status === 0);
      
      setTotalPublished(published.length);
      setTotalDrafts(drafts.length);
      
      console.log(`Published: ${published.length}, Drafts: ${drafts.length}`);
      
      if (published.length === 0) {
        console.log("No published articles found");
        setArticles([]);
        setAllTags([]);
        setAllAuthors([]);
      } else {
        // Process only published articles
        const processed = published.map(article => ({
          ...article,
          authorName: article.authorName || article.author || "Anonymous",
          previewText: stripHtml(article.body, 120),
          readTime: getReadTimeFromHtml(article.body)
        }));
        
        setArticles(processed);
        
        // Extract unique tags and authors from published articles only
        const tags = new Set();
        const authors = new Set();
        
        processed.forEach(article => {
          if (article.tags && Array.isArray(article.tags)) {
            article.tags.forEach(tag => tags.add(tag));
          }
          if (article.authorName) {
            authors.add(article.authorName);
          }
        });
        
        setAllTags(Array.from(tags).sort());
        setAllAuthors(Array.from(authors).sort());
        
        console.log(`Processed ${processed.length} published articles`);
        console.log("Tags from published:", Array.from(tags));
        console.log("Authors from published:", Array.from(authors));
      }
      
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Failed to load articles. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortArticles = () => {
    let filtered = [...articles];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.previewText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.authorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(article =>
        article.tags && article.tags.includes(selectedTag)
      );
    }

    // Apply author filter
    if (selectedAuthor) {
      filtered = filtered.filter(article =>
        article.authorName === selectedAuthor
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "author":
        filtered.sort((a, b) => a.authorName.localeCompare(b.authorName));
        break;
      default:
        break;
    }

    setFilteredArticles(filtered);
    setTotalPages(Math.ceil(filtered.length / articlesPerPage));
    setCurrentPage(1);
  };

  const getCurrentArticles = () => {
    const indexOfLastArticle = currentPage * articlesPerPage;
    const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
    return filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  };

  const handleTagClick = (tag) => {
    setSelectedTag(tag === selectedTag ? "" : tag);
    setCurrentPage(1);
  };

  const handleAuthorClick = (author) => {
    setSelectedAuthor(author === selectedAuthor ? "" : author);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTag("");
    setSelectedAuthor("");
    setSortBy("newest");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const goToHome = () => {
    navigate("/");
  };

  // Check if we have any published articles
  const hasPublishedArticles = articles.length > 0;

  return (
    <div className="pub-articles-wrapper">
      {/* Simple Header with Home Button */}
      <header className="pub-articles-header">
        <div className="pub-articles-header-content">
        






<div className="brand" onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            navigate("/");
          }} style={{ cursor: 'pointer' }}>
            PublishHub
          </div>


          <button className="pub-articles-home-btn" onClick={goToHome}>
            <span className="btn-icon">🏠</span>
            Back to Home
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pub-articles-hero">
        <div className="pub-articles-hero-content">
          <h1 className="pub-articles-hero-title">
            Discover Amazing <span className="hero-gradient">Articles</span>
          </h1>
          <p className="pub-articles-hero-subtitle">
            Explore content from talented writers around the world
          </p>
          
          {/* Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{totalPublished}</span>
              <span className="stat-label">Published Articles</span>
            </div>
            {/* <div className="hero-stat">
              <span className="stat-number">{totalDrafts}</span>
              <span className="stat-label">Drafts</span>
            </div> */}
            <div className="hero-stat">
              <span className="stat-number">{allAuthors.length}</span>
              <span className="stat-label">Authors</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="pub-articles-main">
        <div className="pub-articles-container">
          {/* Only show filters if there are published articles */}
          {hasPublishedArticles && (
            <>
              {/* Search and Filters */}
              <div className="pub-articles-controls">
                <div className="pub-articles-search">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search articles by title or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="pub-articles-filter-bar">
                  <div className="pub-articles-sort">
                    <label className="sort-label">Sort:</label>
                    <select 
                      className="sort-select"
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="title">Title A-Z</option>
                      <option value="author">Author A-Z</option>
                    </select>
                  </div>

                
                </div>
              </div>

           


              {/* Results Info */}
              <div className="pub-articles-results">
                <p>
                  Showing <strong>{getCurrentArticles().length}</strong> of{' '}
                  <strong>{filteredArticles.length}</strong> articles
                  {selectedTag && (
                    <span className="result-tag"> #{selectedTag}</span>
                  )}
                  {selectedAuthor && (
                    <span className="result-author"> by {selectedAuthor}</span>
                  )}
                </p>
              </div>
            </>
          )}

          {/* Articles Grid */}
          {loading ? (
            <div className="pub-articles-loading">
              <div className="spinner"></div>
              <p>Loading articles...</p>
            </div>
          ) : (
            <>
              {!hasPublishedArticles ? (
                <div className="pub-articles-empty">
                  <span className="empty-icon">📝</span>
                  <h3>No Published Articles Yet</h3>
                  <p>
                    {totalDrafts > 0 
                      ? `There are ${totalDrafts} draft articles waiting to be published. Check back soon!` 
                      : "There are no articles available at the moment. Check back later!"}
                  </p>
                  {totalDrafts > 0 && (
                    <div className="draft-notice">
                    
                      <span>{totalDrafts} article{totalDrafts > 1 ? 's are' : ' is'} in draft mode</span>
                    </div>
                  )}
                  <button className="home-btn" onClick={goToHome}>
                    Return to Home
                  </button>
                </div>
              ) : (
                <>
                  {filteredArticles.length === 0 ? (
                    <div className="pub-articles-empty">
                      <span className="empty-icon">🔍</span>
                      <h3>No matching articles</h3>
                      <p>Try adjusting your search or filters</p>
                      <button 
                        className="empty-clear-btn"
                        onClick={clearFilters}
                      >
                        Clear All Filters
                      </button>
                    </div>
                  ) : (
                    <>
                    <div className="pub-articles-grid">
  {getCurrentArticles().map((article) => (
    <div 
      key={article.id} 
      className="pub-article-card"
      // Removed the onClick from the div
    >
      <div className="card-content">
        <div className="card-meta">
          <span 
            className="card-author"
            onClick={(e) => {
              e.stopPropagation();
              handleAuthorClick(article.authorName);
            }}
          >
            👤 {article.authorName}
          </span>
          <span className="card-date">
            📅 {formatDate(article.createdAt)}
          </span>
        </div>
        
        <h3 className="card-title">{article.title}</h3>
        
        <p className="card-excerpt">
          {article.previewText}
        </p>
        
        <div className="card-footer">
          <div className="card-tags">
            {article.tags && article.tags.slice(0, 3).map((tag, i) => (
              <span 
                key={i} 
                className="card-tag"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagClick(tag);
                }}
              >
                {tag}
              </span>
            ))}
            {article.tags?.length > 3 && (
              <span className="card-tag more">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        </div>
        
        <button 
          className="card-read-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/public/articles/${article.id}`);
          }}
        >
          Read Article
          <span className="btn-arrow">→</span>
        </button>
      </div>
    </div>
  ))}
</div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="pub-articles-pagination">
                          <button
                            className="pagination-arrow"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            ← Previous
                          </button>
                          
                          <div className="pagination-numbers">
                            {[...Array(totalPages)].map((_, i) => {
                              const pageNum = i + 1;
                              if (
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                              ) {
                                return (
                                  <button
                                    key={pageNum}
                                    className={`pagination-number ${
                                      currentPage === pageNum ? 'active' : ''
                                    }`}
                                    onClick={() => setCurrentPage(pageNum)}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              } else if (
                                pageNum === currentPage - 3 ||
                                pageNum === currentPage + 3
                              ) {
                                return (
                                  <span key={pageNum} className="pagination-dots">
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>

                          <button
                            className="pagination-arrow"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="pub-articles-footer">
        <p>© 2026 PublishHub. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PublicArticlesPage;