// pages/dashboard/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardPage.css";

import Header from "../../components/shared/header/Header.jsx";
import AuthorHeader from "./components/AuthorHeader";
import StatsGrid from "./components/StatsGrid";
import RecentArticles from "./components/RecentArticles";
import PopularArticles from "./components/PopularArticles";
import LoadingState from "./components/LoadingState";

import { 
  getUserArticles, 
  getRecentArticles,
} from "../../services/UserdashboardService.js";

const DashboardPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    totalArticles: 0,
    published: 0,
    drafts: 0,
    totalLikes: 0,
    totalComments: 0
  });

  const [recentArticles, setRecentArticles] = useState([]);
  const [popularArticles, setPopularArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [author, setAuthor] = useState({
    name: "",
    avatar: "👨‍💻",
    bio: "",
    articlesCount: 0
  });

  // Get user info from storage
  const getUserFromStorage = () => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      return { name: storedName };
    }
    
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        return { name: "Author", email: payload.email };
      } catch (e) {
        console.error("Error decoding token:", e);
        return { name: "Author" };
      }
    }
    return { name: "Author" };
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const userInfo = getUserFromStorage();
        setAuthor({
          name: userInfo.name,
          avatar: "👨‍💻",
          bio: "Content creator",
          articlesCount: 0
        });
        
        const response = await getUserArticles();
        const articles = response.articles || response;
        const authorTotals = response.authorTotals || null;
        
        if (authorTotals) {
          setStats({
            totalArticles: authorTotals.totalArticles,
            published: authorTotals.publishedCount,
            drafts: authorTotals.draftCount,
            totalLikes: authorTotals.totalLikes,
            totalComments: authorTotals.totalComments
          });
        } else {
          const published = articles.filter(a => a.published_status === 1).length;
          const drafts = articles.filter(a => a.published_status === 0).length;
          const totalLikes = articles.reduce((sum, a) => sum + (a.likesCount || 0), 0);
          const totalComments = articles.reduce((sum, a) => sum + (a.commentsCount || 0), 0);
          
          setStats({
            totalArticles: articles.length,
            published,
            drafts,
            totalLikes,
            totalComments
          });
        }

        setRecentArticles(getRecentArticles(articles, 5));

        const popular = [...articles]
          .filter(a => a.published_status === 1)
          .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
          .slice(0, 3);
        setPopularArticles(popular);

        if (articles.length > 0) {
          const firstArticle = articles[0];
          setAuthor(prev => ({
            ...prev,
            name: firstArticle.authorName || prev.name,
            articlesCount: articles.length
          }));
        } else {
          setAuthor(prev => ({
            ...prev,
            articlesCount: 0
          }));
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    } else {
      navigate("/page/loginpage");
    }
  }, [token, navigate]);

  // Calculate percentages
  const publishedPercentage = stats.totalArticles > 0 
    ? (stats.published / stats.totalArticles * 100).toFixed(1) 
    : 0;
  const draftPercentage = stats.totalArticles > 0 
    ? (stats.drafts / stats.totalArticles * 100).toFixed(1) 
    : 0;

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="dashboard-wrapper">
      <Header /> {/* Removed onCreateArticle prop */}

      <div className="dashboard-layout">
        <main className="dashboard-content">
          <AuthorHeader author={author} stats={stats} />
          
          <StatsGrid 
            stats={stats}
            publishedPercentage={publishedPercentage}
            draftPercentage={draftPercentage}
          />

          <div className="dashboard-row">
            <RecentArticles articles={recentArticles} />
            <PopularArticles articles={popularArticles} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;