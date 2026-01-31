import React, { useState } from "react";
import "./App.css";
import Layout from "./Layout";

// Import components
import ProgramOverview from "./components/ProgramOverview";
import ModuleOverview from "./components/ModuleOverview";
import LecturerOverview from "./components/LecturerOverview";
import RoomOverview from "./components/RoomOverview";
import GroupOverview from "./components/GroupOverview";
import ConstraintOverview from "./components/ConstraintOverview";
import AvailabilityOverview from "./components/AvailabilityOverview";

function App() {
  const [activeTab, setActiveTab] = useState("programs");

  // ✅ NEW: Global Role State for Testing (Passed to Layout)
  const [currentUserRole, setCurrentUserRole] = useState("Admin");

  const [navData, setNavData] = useState(null);

  const handleNavigate = (tab, data = null) => {
    setActiveTab(tab);
    setNavData(data);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "programs":
        return <ProgramOverview initialData={navData} clearInitialData={() => setNavData(null)} currentUserRole={currentUserRole} />;
      case "modules":
        return <ModuleOverview onNavigate={handleNavigate} currentUserRole={currentUserRole} />;
      case "lecturers":
        return <LecturerOverview currentUserRole={currentUserRole} />;
      case "rooms":
        return <RoomOverview currentUserRole={currentUserRole} />;
      case "groups":
        return <GroupOverview currentUserRole={currentUserRole} />;
      case "constraints":
        return <ConstraintOverview currentUserRole={currentUserRole} />;
      case "availabilities":
        return <AvailabilityOverview currentUserRole={currentUserRole} />;
      default:
        return <ProgramOverview />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentUserRole={currentUserRole}
      setCurrentUserRole={setCurrentUserRole}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;