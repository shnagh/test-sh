import React, { useState } from "react";
import Layout from "./Layout";

// Import your existing components
import ProgramOverview from "./ProgramOverview";
import ModuleOverview from "./ModuleOverview";
import LecturerOverview from "./LecturerOverview";
import RoomOverview from "./RoomOverview";
import GroupOverview from "./GroupOverview";
import ConstraintOverview from "./ConstraintOverview";
import AvailabilityOverview from "./AvailabilityOverview";

function App() {
  const [activeTab, setActiveTab] = useState("programs");

  // Logic to render the correct component inside the layout
  const renderContent = () => {
    switch (activeTab) {
      case "programs":
        return <ProgramOverview />;
      case "modules":
        return <ModuleOverview />;
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