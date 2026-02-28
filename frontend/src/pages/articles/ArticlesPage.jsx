// ArticlesPage.jsx
import React, { useState, useEffect } from "react";
import Header from "../../components/shared/header/Header.jsx";
import "./ArticlesPage.css";
import ArticleModals from "./components/ArticleModals.jsx";
import ArticleTable from "./components/ArticleTable.jsx";
import ArticleFilters from "./components/ArticleFilters.jsx";

import { getArticles } from "../../services/articleService.js";



const ArticlesPage = () => {
  const token = localStorage.getItem("token");
  const currentUserId = Number(localStorage.getItem("userId"));
  
  // ============ SHARED STATE ============
  const [articles, setArticles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ============ FETCH ARTICLES (only shared logic) ============
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const data = await getArticles(token);
        
        // Basic normalization
        const normalized = data.map(a => ({
          ...a,
          tags: typeof a.tags === "string"
            ? a.tags.split(",").map(t => t.trim()).filter(t => t)
            : a.tags || [],
          authorName: a.authorName || "Unknown",
          authorId: Number(a.authorId)
        }));

        const userArticles = normalized.filter(a => a.authorId === currentUserId);
        setArticles(userArticles);
        setFiltered(userArticles);
      } catch (err) {
        // console.error("FETCH ERROR:", err);
        // setError("Failed to load articles");
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserId) {
      fetchArticles();
    }
  }, [token, currentUserId]);

  // ============ LOADING STATE ============
  if (isLoading) {
    return (
      <div className="dashboard-wrapper">
        <Header />
        <div className="dashboard-layout">
          <main className="dashboard-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading your articles...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Header />
      <div className="dashboard-layout">
        <main className="dashboard-content">
          {/* Filters Component - with its own logic */}
          <ArticleFilters 
            articles={articles}
            setFiltered={setFiltered}
            setError={setError}
            token={token}
            currentUserId={currentUserId}
          />

          {error && <div className="error-message">{error}</div>}

          {/* Table Component - with its own logic */}
          <ArticleTable 
            articles={articles}
            filtered={filtered}
            setArticles={setArticles}
            setFiltered={setFiltered}
            setError={setError}
            token={token}
            currentUserId={currentUserId}
          />
        </main>
      </div>

      {/* Modals Component - with its own logic */}
      <ArticleModals
        articles={articles}
        setArticles={setArticles}
        setFiltered={setFiltered}
        setError={setError}
        token={token}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default ArticlesPage;