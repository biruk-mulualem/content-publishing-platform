// pages/dashboard/components/PopularArticles.jsx
const PopularArticles = ({ articles }) => {
  console.log("PopularArticles received articles:", articles);
  
  // Check what properties each article has
  if (articles && articles.length > 0) {
    console.log("First article structure:", articles[0]);
    console.log("First article likesCount:", articles[0].likesCount);
    console.log("First article commentsCount:", articles[0].commentsCount);
  }
  
  // Filter out articles with 0 likes
  const articlesWithLikes = articles.filter(article => {
    console.log(`Article "${article.title}" likes:`, article.likesCount);
    return (article.likesCount || 0) > 0;
  });
  
  console.log("Articles with likes:", articlesWithLikes);

  return (
    <div className="popular-box">
      <div className="box-header">
        <h2>
          <span className="header-icon">🔥</span>
          Most Liked Articles
        </h2>
      </div>
      <div className="popular-list">
        {articlesWithLikes.length > 0 ? (
          articlesWithLikes.map((article, index) => (
            <div key={article.id} className="popular-item">
              <div className="rank-badge">{index + 1}</div>
              <div className="popular-content">
                <h4>{article.title}</h4>
                <div className="popular-meta">
                  <span>❤️ {article.likesCount || 0} likes</span>
                  <span>💬 {article.commentsCount || 0} comments</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-data">
            No articles with likes yet. Publish engaging content to get likes!
          </div>
        )}
      </div>
    </div>
  );
};

export default PopularArticles;