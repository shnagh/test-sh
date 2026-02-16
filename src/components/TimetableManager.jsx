import React, { useState, useEffect } from "react";
import api from "../api";

export default function TimetableManager() {
  // --- ESTADOS ---
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [scheduleData, setScheduleData] = useState([]);

  const [offeredModules, setOfferedModules] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Estado para la "vista visual" (Day, Week, etc.)
  const [viewMode, setViewMode] = useState("Week");

  const [newEntry, setNewEntry] = useState({
    day: "",
    time: "",
    offered_module_id: "",
    room_id: ""
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const hours = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  // Colores Pastel (Idénticos a la referencia)
  const pastelColors = [
    { bg: "#fff9c4", border: "#fbc02d", text: "#5d4037" }, // Amarillo
    { bg: "#c8e6c9", border: "#43a047", text: "#1b5e20" }, // Verde
    { bg: "#bbdefb", border: "#1976d2", text: "#0d47a1" }, // Azul
    { bg: "#f8bbd0", border: "#c2185b", text: "#880e4f" }, // Rosa
    { bg: "#e1bee7", border: "#7b1fa2", text: "#4a148c" }, // Lila
  ];

  const getColorForModule = (moduleName) => {
    if (!moduleName) return pastelColors[0];
    let hash = 0;
    for (let i = 0; i < moduleName.length; i++) {
      hash = moduleName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % pastelColors.length;
    return pastelColors[index];
  };

  // --- CARGA DE DATOS ---
  useEffect(() => {
    async function loadSemesters() {
      try {
        const s = await api.getSemesters();
        setSemesters(s);
        if (s.length > 0) setSelectedSemester(s[0].name);
      } catch (e) { console.error("Error loading semesters", e); }
    }
    loadSemesters();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      loadSchedule();
      loadDropdowns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester]);

  async function loadSchedule() {
    setLoading(true);
    try {
      const data = await api.getSchedule(selectedSemester);
      setScheduleData(data);
    } catch (e) { console.error("Error loading schedule", e); }
    setLoading(false);
  }

  async function loadDropdowns() {
    try {
      const mods = await api.getOfferedModules(selectedSemester);
      setOfferedModules(mods);
      const r = await api.getRooms();
      setRooms(r);
    } catch (e) { console.error("Error loading dropdowns", e); }
  }

  // --- HANDLERS ---
  const handleCellClick = (day, time) => {
    setNewEntry({ day, time, offered_module_id: "", room_id: "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!newEntry.offered_module_id || !newEntry.room_id) return alert("Please select module and room");
    try {
      const startHour = parseInt(newEntry.time.split(":")[0]);
      const endHour = startHour + 1;
      const endTime = `${endHour < 10 ? '0' : ''}${endHour}:00`;

      await api.createScheduleEntry({
        offered_module_id: newEntry.offered_module_id,
        room_id: newEntry.room_id,
        day_of_week: newEntry.day,
        start_time: newEntry.time,
        end_time: endTime,
        semester: selectedSemester
      });
      setShowModal(false);
      loadSchedule();
    } catch (e) { alert("Error saving: " + e.message); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this session?")) return;
    try {
      await api.deleteScheduleEntry(id);
      loadSchedule();
    } catch (e) { alert("Error deleting"); }
  };

  const getEntryForSlot = (day, time) => {
    const hourPrefix = time.split(":")[0];
    return scheduleData.find(entry =>
      entry.day_of_week === day && entry.start_time.startsWith(hourPrefix)
    );
  };

  // Estilos de botones de navegación (Day, Week, Month, Year)
  const navButtonStyle = (mode) => ({
    padding: "6px 16px",
    background: viewMode === mode ? "#2b4a8e" : "white", // Azul oscuro si activo
    color: viewMode === mode ? "white" : "#2b4a8e",
    border: "1px solid #2b4a8e",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "500",
    transition: "all 0.2s"
  });

  return (
    <div style={{ padding: "30px", fontFamily: "'Segoe UI', sans-serif", background: "#ffffff", minHeight: "100vh" }}>

      {/* === HEADER SUPERIOR (FILTROS) === */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "25px", marginBottom: "25px", alignItems: "flex-end" }}>

        {/* Semester Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#495057", marginBottom: "5px" }}>Semester</label>
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid #ced4da", background: "#f8f9fa", minWidth: "180px" }}
          >
            {semesters.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        {/* Groups Filter (Visual) */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#495057", marginBottom: "5px" }}>Groups</label>
          <select disabled style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid #ced4da", background: "white", color: "#aaa", minWidth: "180px" }}>
            <option>BIT 0525, DFD 1024...</option>
          </select>
        </div>

        {/* Lecturer Filter (Visual) */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#495057", marginBottom: "5px" }}>Lecturer</label>
          <select disabled style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid #ced4da", background: "white", color: "#aaa", minWidth: "150px" }}>
            <option>All</option>
          </select>
        </div>

        {/* Location Filter (Visual) */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#495057", marginBottom: "5px" }}>Location</label>
          <select disabled style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid #ced4da", background: "white", color: "#aaa", minWidth: "100px" }}>
            <option>All</option>
          </select>
        </div>
      </div>

      {/* === BARRA DE NAVEGACIÓN (Day, Week, Arrows, Toggle) === */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>

        {/* Botones de Vista */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={navButtonStyle("Day")} onClick={() => setViewMode("Day")}>Day</button>
          <button style={navButtonStyle("Week")} onClick={() => setViewMode("Week")}>Week</button>
          <button style={navButtonStyle("Month")} onClick={() => setViewMode("Month")}>Month</button>
          <button style={navButtonStyle("Year")} onClick={() => setViewMode("Year")}>Year</button>
        </div>

        {/* Flechas y Fecha Central */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px", color: "#2b4a8e", fontWeight: "bold", fontSize: "1.1rem" }}>
          <span style={{ cursor: "pointer", fontSize: "1.5rem", userSelect:"none" }}>‹</span>
          {/* Fecha simulada para el efecto visual */}
          <span>Monday 02.06.25</span>
          <span style={{ cursor: "pointer", fontSize: "1.5rem", userSelect:"none" }}>›</span>
        </div>

        {/* Toggle List/Calendar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#666", fontSize: "0.9rem" }}>List View</span>
          {/* Toggle Switch Visual */}
          <div style={{
            width: "40px", height: "22px", background: "#2b4a8e", borderRadius: "15px",
            position: "relative", cursor: "pointer", display: "flex", alignItems: "center"
          }}>
            <div style={{
              width: "16px", height: "16px", background: "white", borderRadius: "50%",
              position: "absolute", right: "3px", boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
            }}></div>
          </div>
          <span style={{ color: "#2b4a8e", fontWeight: "bold", fontSize: "0.9rem" }}>Calendar View</span>
        </div>
      </div>

      {/* === CALENDARIO GRID === */}
      {loading ? <p>Loading schedule...</p> : (
        <div style={{ borderTop: "1px solid #eee", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <tbody>
              {hours.map(hour => (
                <tr key={hour}>
                  {/* Columna de Hora (Izquierda) */}
                  <td style={{
                    padding: "10px", verticalAlign: "top", textAlign: "center",
                    color: "#333", fontSize: "0.8rem", fontWeight: "bold",
                    borderRight: "1px solid #eee", borderBottom: "1px solid #f5f5f5", width: "60px"
                  }}>
                    {hour}
                  </td>

                  {/* Celdas de Días */}
                  {days.map(day => {
                    const entry = getEntryForSlot(day, hour);
                    const colors = entry ? getColorForModule(entry.module_name) : null;

                    return (
                      <td
                        key={day}
                        onClick={() => !entry && handleCellClick(day, hour)}
                        style={{
                          borderRight: "1px solid #eee", borderBottom: "1px solid #f5f5f5",
                          height: "80px", padding: "4px", verticalAlign: "top",
                          cursor: entry ? "default" : "pointer"
                        }}
                        onMouseEnter={(e) => { if(!entry) e.currentTarget.style.background = "#fafafa"; }}
                        onMouseLeave={(e) => { if(!entry) e.currentTarget.style.background = "transparent"; }}
                      >
                        {entry ? (
                          <div style={{
                            background: colors.bg,
                            borderLeft: `4px solid ${colors.border}`,
                            borderRadius: "6px",
                            height: "100%",
                            padding: "6px 8px",
                            boxSizing: "border-box",
                            position: "relative",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                          }}>
                            {/* Título de la Materia */}
                            <div style={{ fontWeight: "bold", fontSize: "0.8rem", color: "#333", marginBottom: "2px", lineHeight: "1.2" }}>
                              {entry.module_name}
                            </div>
                            {/* Código y Profe */}
                            <div style={{ fontSize: "0.7rem", color: "#555", marginBottom: "2px" }}>
                              BIT 0525 (Simulated)
                            </div>
                             {/* Ubicación y Hora */}
                            <div style={{ fontSize: "0.7rem", color: "#666" }}>
                              {entry.lecturer_name} <br/>
                              <span style={{fontWeight:"bold"}}>📍 {entry.room_name}</span> <br/>
                              <span style={{fontSize:"0.65rem", opacity:0.8}}>{entry.start_time} - {entry.end_time}</span>
                            </div>

                            {/* Botón Borrar (discreto) */}
                            <button
                              onClick={(e) => handleDelete(entry.id, e)}
                              style={{
                                position: "absolute", bottom: "5px", right: "5px",
                                background: "none", border: "none", color: "#d32f2f",
                                cursor: "pointer", fontSize: "14px", padding: 0
                              }}
                              title="Remove"
                            >✕</button>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* === MODAL === */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(2px)" }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", width: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#333" }}>Schedule Class</h3>

            <label style={{display:"block", marginBottom:"5px", fontWeight:"600", fontSize:"0.9rem"}}>Module</label>
            <select
              style={{width:"100%", padding:"10px", marginBottom:"15px", borderRadius:"6px", border:"1px solid #ddd", background:"#f9f9f9"}}
              value={newEntry.offered_module_id}
              onChange={e => setNewEntry({...newEntry, offered_module_id: e.target.value})}
            >
              <option value="">-- Select Module --</option>
              {offeredModules.map(m => (
                <option key={m.id} value={m.id}>{m.module_name} ({m.lecturer_name})</option>
              ))}
            </select>

            <label style={{display:"block", marginBottom:"5px", fontWeight:"600", fontSize:"0.9rem"}}>Room</label>
            <select
              style={{width:"100%", padding:"10px", marginBottom:"25px", borderRadius:"6px", border:"1px solid #ddd", background:"#f9f9f9"}}
              value={newEntry.room_id}
              onChange={e => setNewEntry({...newEntry, room_id: e.target.value})}
            >
              <option value="">-- Select Room --</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
              ))}
            </select>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", background: "white", border: "1px solid #ccc", borderRadius:"6px", cursor:"pointer" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "10px 20px", background: "#2b4a8e", color: "white", border: "none", borderRadius:"6px", cursor:"pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}