import React from "react";
import "./App.css";

const Layout = ({ activeTab, setActiveTab, children, currentUserRole, setCurrentUserRole }) => {

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

        {/* ✅ NEW: Role Selector Footer */}
        <div className="sidebar-footer" style={{display:'flex', flexDirection:'column', gap:'5px'}}>
          <span style={{fontSize:'0.75rem', textTransform:'uppercase', color:'#94a3b8'}}>Testing As:</span>
          <select
            value={currentUserRole}
            onChange={(e) => setCurrentUserRole(e.target.value)}
            style={{
                background: '#334155',
                color: 'white',
                border: '1px solid #475569',
                padding: '5px',
                borderRadius: '4px',
                outline: 'none',
                cursor: 'pointer'
            }}
          >
            <option value="Admin">Admin</option>
            <option value="PM">Program Manager</option>
            <option value="HoSP">Head of Program</option>
            <option value="Lecturer">Lecturer</option>
            <option value="Student">Student</option>
          </select>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h1 className="page-title">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
            </h1>
            <span style={{
                background:'#e2e8f0', color:'#475569', padding:'4px 10px',
                borderRadius:'15px', fontSize:'0.8rem', fontWeight:'bold'
            }}>
                {currentUserRole} View
            </span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;