// pages/dashboard/components/StatsGrid.jsx
import { useEffect, useState } from "react";

const StatsGrid = ({ stats, publishedPercentage, draftPercentage }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsSmallMobile(window.innerWidth <= 480);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const statCards = [
    {
      icon: "📄",
      title: "Total Articles",
      value: stats.totalArticles,
      className: "total",
      progress: null
    },
    {
      icon: "✅",
      title: "Published",
      value: stats.published,
      className: "published",
      progress: publishedPercentage,
      progressClass: ""
    },
    {
      icon: "✏️",
      title: "Drafts",
      value: stats.drafts,
      className: "draft",
      progress: draftPercentage,
      progressClass: "draft"
    },
    {
      icon: "❤️",
      title: "Total Likes",
      value: stats.totalLikes,
      className: "likes",
      progress: null
    },
    {
      icon: "💬",
      title: "Total Comments",
      value: stats.totalComments,
      className: "comments",
      progress: null
    }
  ];

  // For mobile, we'll show a simplified layout
  if (isSmallMobile) {
    return (
      <div className="stats-grid-mobile-small">
        {statCards.map((card, index) => (
          <div key={index} className={`stat-card-small ${card.className}`}>
            <div className="stat-icon-small">{card.icon}</div>
            <div className="stat-content-small">
              <span className="stat-label-small">{card.title}</span>
              <span className="stat-number-small">{card.value}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="stats-grid-mobile">
        {statCards.map((card, index) => (
          <div key={index} className={`stat-card-mobile ${card.className}`}>
            <div className="stat-icon-mobile">{card.icon}</div>
            <div className="stat-content-mobile">
              <div className="stat-header-mobile">
                <span className="stat-title-mobile">{card.title}</span>
                <span className="stat-number-mobile">{card.value}</span>
              </div>
              {card.progress !== null && (
                <div className="stat-progress-mobile">
                  <div 
                    className={`progress-bar-mobile ${card.progressClass}`} 
                    style={{ width: `${card.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop view
  return (
    <div className="stats-grid">
      {statCards.map((card, index) => (
        <div key={index} className={`stat-card ${card.className}`}>
          <div className="stat-icon">{card.icon}</div>
          <div className="stat-content">
            <h4>{card.title}</h4>
            <p className="stat-number">{card.value}</p>
            {card.progress !== null && (
              <div className="stat-progress">
                <div 
                  className={`progress-bar ${card.progressClass}`} 
                  style={{ width: `${card.progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;