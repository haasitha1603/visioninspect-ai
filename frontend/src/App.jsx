import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Login from "./pages/Login";
import "./App.css";

function App() {
  const [page, setPage] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [backendHealthy, setBackendHealthy] = useState(true);

  useEffect(() => {
    // Load stored user authentication state if present
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem("user");
      }
    }

    // Health check ping to FastAPI backend
    fetch("http://127.0.0.1:8000/")
      .then((res) => res.json())
      .then(() => setBackendHealthy(true))
      .catch(() => setBackendHealthy(false));
  }, []);

  const isSupervisor = user?.role === "FACTORY_SUPERVISOR" || user?.role === "factory_supervisor";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("dashboard");
  };

  const handleLoginSuccess = (loginData) => {
    const userData = {
      id: loginData.user_id,
      name: loginData.name,
      role: loginData.role
    };
    setUser(userData);
    setPage("dashboard");
  };

  return (
    <div className="app-layout">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-brand" onClick={() => setPage("dashboard")}>
          <div className="brand-logo">
            <span className="logo-icon">👁️</span>
          </div>
          <div className="brand-text">
            <span className="brand-title">VISIONINSPECT AI</span>
            <span className="brand-subtitle">
              {isSupervisor ? "Supervisor Quality Oversight" : "Industrial Quality Control"}
            </span>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-link ${page === "dashboard" ? "active" : ""}`}
            onClick={() => setPage("dashboard")}
          >
            {isSupervisor ? "📈 Inspection Monitoring" : "📊 Inspection Dashboard"}
          </button>
          
          {/* Hide Upload link from Factory Supervisor */}
          {!isSupervisor && (
            <button
              className={`nav-link ${page === "upload" ? "active" : ""}`}
              onClick={() => setPage("upload")}
            >
              📤 Upload Inspection
            </button>
          )}
        </nav>

        <div className="nav-right">
          {/* Backend Connection Badge */}
          <div className={`status-indicator ${backendHealthy ? "online" : "offline"}`}>
            <span className="dot"></span>
            <span>{backendHealthy ? "API Connected" : "API Offline"}</span>
          </div>

          {/* User Profile / Auth Toggle */}
          {user ? (
            <div className="user-profile-badge">
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">
                  {user.role === "FACTORY_SUPERVISOR" ? "Factory Supervisor" : "Quality Engineer"}
                </span>
              </div>
              <button className="btn btn-sm btn-outline" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <button className="btn btn-sm btn-primary" onClick={() => setPage("login")}>
              Inspector Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {page === "login" ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : page === "upload" && !isSupervisor ? (
          <Upload onViewDashboard={() => setPage("dashboard")} user={user} />
        ) : (
          <Dashboard
            onViewUpload={() => setPage("upload")}
            user={user}
            isSupervisor={isSupervisor}
          />
        )}
      </main>

      {/* Industrial Footer */}
      <footer className="footer">
        <div className="footer-content">
          <span>VisionInspect AI • Manufacturing Defect Detection & Quality Control System</span>
          <span>FastAPI • React • PostgreSQL • OpenCV • MVTec AD Dataset</span>
        </div>
      </footer>
    </div>
  );
}

export default App;