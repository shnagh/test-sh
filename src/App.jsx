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

  // State to hold data when switching tabs (e.g., jumping to a specific program)
  const [navData, setNavData] = useState(null);

  const handleNavigate = (tab, data = null) => {
    setActiveTab(tab);
    setNavData(data);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "programs":
        return <ProgramOverview initialData={navData} clearInitialData={() => setNavData(null)} />;
      case "modules":
        return <ModuleOverview onNavigate={handleNavigate} />;
      case "lecturers":
        return <LecturerOverview />;
      case "rooms":
        return <RoomOverview />;
      case "groups":
        return <GroupOverview />;
      case "constraints":
        return <ConstraintOverview />;
      case "availabilities":
        return <AvailabilityOverview />;
      default:
        return <ProgramOverview />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;