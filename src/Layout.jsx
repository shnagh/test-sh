import React from "react";
import "./App.css"; // Same folder

const Layout = ({ activeTab, setActiveTab, children }) => {

  // Helper to render individual links
  const NavLink = ({ id, icon, label }) => (
    <div
      className={`nav-item ${activeTab === id ? "active" : ""}`}
      onClick={() => setActiveTab(id)}
    >
      <span style={{ fontSize: "1.2em" }}>{icon}</span>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="app-container">
      {/* --- LEFT SIDEBAR --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          ICSS Scheduler
        </div>

        <div className="sidebar-nav">

          <div className="nav-section-title">Curriculum</div>
          <NavLink id="programs" icon="" label="Study Programs" />
          <NavLink id="modules" icon="" label="Modules" />

          <div className="nav-section-title">People & Groups</div>
          <NavLink id="lecturers" icon="" label="Lecturers" />
          <NavLink id="groups" icon="" label="Student Groups" />

          <div className="nav-section-title">Facilities</div>
          <NavLink id="rooms" icon="" label="Rooms" />

          <div className="nav-section-title">Planning Logic</div>
          <NavLink id="constraints" icon="" label="Constraints & Rules" />
          <NavLink id="availabilities" icon="" label="Availability" />
        </div>

        <div className="sidebar-footer">
          Logged in as Admin
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
          </h1>
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;