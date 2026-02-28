// pages/dashboard/components/AuthorHeader.jsx
const AuthorHeader = ({ author, stats }) => {
  return (
    <div className="author-header">
      <div className="author-avatar">{author.avatar}</div>
      <div className="author-info">
        <h1>{author.name}'s Dashboard</h1>
        <p className="author-bio">{author.bio}</p>
        <div className="author-meta">
          <span>📝 {author.articlesCount} total articles</span>
          <span>❤️ {stats.totalLikes} total likes</span>
          <span>💬 {stats.totalComments} total comments</span>
        </div>
      </div>
    </div>
  );
};

export default AuthorHeader;