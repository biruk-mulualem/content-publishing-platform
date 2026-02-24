import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/homepage/HomePage";
import LoginPage from "./pages/loginpage/LoginPage";
import Dashboard from "./pages/dashboard/DashboardPage";
import ArticlesPage from "./pages/articles/ArticlesPage";
import ArticleDetailPage from "./pages/articles/ArticleDetailPage/ArticleDetailPage";
import PublicArticlesPage from "./pages/publicArticle/PublicArticlesPage";
import ArticleDetailPublicView from "./pages/publicArticle/articleDetailPublic/articleDetailPublicView";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/page/loginpage" element={<LoginPage />} />
      <Route path="/page/dashboard" element={<Dashboard />} />
      <Route path="/page/articlepage" element={<ArticlesPage />} />
      <Route path="/articles/:id" element={<ArticleDetailPage />} />
      <Route path="/page/publicArticlesPage" element={<PublicArticlesPage />} />
      <Route path="/public/articles/:id" element={<ArticleDetailPublicView />} />
    </Routes>
  );
}

export default App;