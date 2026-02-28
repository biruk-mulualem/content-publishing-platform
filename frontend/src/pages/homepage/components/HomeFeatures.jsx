// pages/homepage/components/HomeFeatures.jsx
const HomeFeatures = () => {
  const features = [
    {
      icon: "📝",
      title: "Article Management",
      description: "Create, edit, and manage your articles with ease.",
      list: ["Create and edit articles", "Rich text formatting", "Draft/Published workflow"]
    },
    {
      icon: "🏷️",
      title: "Tag System",
      description: "Organize and discover content with tags.",
      list: ["Add up to 10 tags per article", "Filter articles by tag", "Popular tags analytics"]
    },
    {
      icon: "📊",
      title: "Author Dashboard",
      description: "Track your content performance and manage your articles.",
      list: ["Article statistics", "Like and comment tracking", "Quick actions menu"]
    },
    {
      icon: "👑",
      title: "Admin Dashboard",
      description: "Complete system oversight and analytics.",
      list: ["System-wide statistics", "User and content monitoring", "Activity logs and insights"]
    }
  ];

  return (
    <section className="features-section">
      <div className="section-header">
        <span className="section-badge">Why Choose Us</span>
        <h2>Everything You Need to Publish</h2>
        <p>Powerful features that make content creation a joy</p>
      </div>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div className="feature-card" key={index}>
            <div className="feature-icon-wrapper">
              <span className="feature-icon">{feature.icon}</span>
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <ul className="feature-list">
              {feature.list.map((item, i) => (
                <li key={i}>✅ {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomeFeatures;