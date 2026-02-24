// App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/homepage/HomePage";
import LoginPage from "./pages/loginpage/LoginPage";
import Dashboard from "./pages/dashboard/DashboardPage";
import ArticlesPage from "./pages/articles/ArticlesPage";
import ArticleDetailPage from "./pages/articles/ArticleDetailPage/ArticleDetailPage";
import PublicArticlesPage from "./pages/publicArticle/PublicArticlesPage";
import ArticleDetailPublicView from "./pages/publicArticle/articleDetailPublic/articleDetailPublicView";
import AdminDashboardPage from "./pages/adminpage/AdminDashboardPage";

import LogViewer from "./pages/adminpage/LogViewer/LogViewer";
import ProtectedRoute from "./components/shared/header/protectedroutes/protectedRoute";
import PublicOnlyRoute from "./components/shared/header/protectedroutes/PublicOnlyRoute";

function App() {
  return (
    <Routes>
      {/*  PUBLIC ROUTES - Anyone can access */}
      <Route path="/" element={<HomePage />} />
      <Route path="/page/publicArticlesPage" element={<PublicArticlesPage />} />
      <Route path="/public/articles/:id" element={<ArticleDetailPublicView />} />
      
      {/*  AUTH ROUTES - Only when NOT logged in */}
      <Route 
        path="/page/loginpage" 
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        } 
      />
      
      {/*  PROTECTED ROUTES - Any logged-in user */}
      <Route 
        path="/page/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/page/articlepage" 
        element={
          <ProtectedRoute>
            <ArticlesPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/articles/:id" 
        element={
          <ProtectedRoute>
            <ArticleDetailPage />
          </ProtectedRoute>
        } 
      />
      
      {/*  ADMIN ROUTES - Only admin role */}
      <Route 
        path="/page/adminDashboard" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/page/logs" 
        element={
          <ProtectedRoute requiredRole="admin">
            <LogViewer />
          </ProtectedRoute>
        } 
      />
      
      {/*  CATCH ALL - Redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;