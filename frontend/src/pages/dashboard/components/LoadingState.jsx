// pages/dashboard/components/LoadingState.jsx
import Header from "../../../components/shared/header/Header.jsx";

const LoadingState = () => {
  return (
    <div className="dashboard-wrapper">
      <Header /> {/* No prop needed */}
      <div className="dashboard-layout">
        <main className="dashboard-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your author dashboard...</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoadingState;