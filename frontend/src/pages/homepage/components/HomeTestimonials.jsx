// pages/homepage/components/HomeTestimonials.jsx
const HomeTestimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Tech Blogger",
      content: "PublishHub has transformed how I publish my technical articles. The editor is a dream to work with!",
      avatar: "👩‍💻",
      rating: 5
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Software Developer",
      content: "The tag filtering system is brilliant. I can organize hundreds of articles effortlessly.",
      avatar: "👨‍💻",
      rating: 5
    },
    {
      id: 3,
      name: "Emma Davis",
      role: "Content Creator",
      content: "Best publishing platform I've used. Simple, powerful, and beautiful.",
      avatar: "👩‍🎨",
      rating: 5
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="section-header">
        <span className="section-badge">Testimonials</span>
        <h2>What Our Writers Say</h2>
        <p>Join thousands of satisfied content creators</p>
      </div>
      <div className="testimonials-grid">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="testimonial-card">
            <div className="testimonial-rating">
              {[...Array(testimonial.rating)].map((_, i) => (
                <span key={i} className="star">★</span>
              ))}
            </div>
            <p className="testimonial-content">"{testimonial.content}"</p>
            <div className="testimonial-author">
              <span className="testimonial-avatar">{testimonial.avatar}</span>
              <div className="testimonial-info">
                <h4>{testimonial.name}</h4>
                <p>{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomeTestimonials;