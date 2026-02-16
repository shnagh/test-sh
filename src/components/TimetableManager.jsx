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

  // 1. ESTADO DE FECHA Y VISTA (EL CEREBRO NUEVO 🧠)
  const [viewMode, setViewMode] = useState("Week"); // "Day" | "Week" | "Month"
  const [currentDate, setCurrentDate] = useState(new Date()); // Fecha seleccionada

  const [newEntry, setNewEntry] = useState({ day: "", time: "", offered_module_id: "", room_id: "" });

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const hours = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  // Colores Pastel
  const pastelColors = [
    { bg: "#fff9c4", border: "#fbc02d", text: "#5d4037" },
    { bg: "#c8e6c9", border: "#43a047", text: "#1b5e20" },
    { bg: "#bbdefb", border: "#1976d2", text: "#0d47a1" },
    { bg: "#f8bbd0", border: "#c2185b", text: "#880e4f" },
    { bg: "#e1bee7", border: "#7b1fa2", text: "#4a148c" },
  ];

  const getColorForModule = (moduleName) => {
    if (!moduleName) return pastelColors[0];
    let hash = 0;
    for (let i = 0; i < moduleName.length; i++) hash = moduleName.charCodeAt(i) + ((hash << 5) - hash);
    return pastelColors[Math.abs(hash) % pastelColors.length];
  };

  // --- CARGA DE DATOS ---
  useEffect(() => {
    async function loadSemesters() {
      try {
        const s = await api.getSemesters();
        setSemesters(s);
        if (s.length > 0) setSelectedSemester(s[0].name);
      } catch (e) { console.error(e); }
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
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadDropdowns() {
    try {
      const mods = await api.getOfferedModules(selectedSemester);
      setOfferedModules(mods);
      const r = await api.getRooms();
      setRooms(r);
    } catch (e) { console.error(e); }
  }

  // --- LÓGICA DE FECHAS (NUEVO) ---

  // Función para avanzar o retroceder
  const handleNavigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === "Day") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "Week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  // Obtener nombre del día actual (ej: "Monday") basado en la fecha seleccionada
  const getDayNameFromDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Formato bonito para el header: "Monday 02.06.25"
  const formattedDateHeader = currentDate.toLocaleDateString('en-GB', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit'
  }).replace(/\//g, '.');

  // Determinar qué días mostrar en la tabla
  // Si es "Week": mostramos todos (Monday-Friday).
  // Si es "Day": mostramos SOLO el día seleccionado.
  const visibleDays = viewMode === "Week"
    ? daysOfWeek
    : [getDayNameFromDate(currentDate)]; // Solo el día actual

  // Validar si el día seleccionado es fin de semana (para evitar mostrar sáb/dom vacíos si no queremos)
  const isWeekend = (dayName) => dayName === "Saturday" || dayName === "Sunday";

  // --- HANDLERS ---
  const handleCellClick = (day, time) => {
    setNewEntry({ day, time, offered_module_id: "", room_id: "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!newEntry.offered_module_id || !newEntry.room_id) return alert("Select module and room");
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
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete session?")) return;
    try { await api.deleteScheduleEntry(id); loadSchedule(); } catch (e) { alert("Error deleting"); }
  };

  const getEntryForSlot = (day, time) => {
    const hourPrefix = time.split(":")[0];
    return scheduleData.find(entry => entry.day_of_week === day && entry.start_time.startsWith(hourPrefix));
  };

  const navButtonStyle = (mode) => ({
    padding: "6px 16px",
    background: viewMode === mode ? "#2b4a8e" : "white",
    color: viewMode === mode ? "white" : "#2b4a8e",
    border: "1px solid #2b4a8e", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500", transition: "all 0.2s"
  });

  return (
    <div style={{ padding: "30px", fontFamily: "'Segoe UI', sans-serif", background: "#ffffff", minHeight: "100vh" }}>

      {/* FILTROS SUPERIORES */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "25px", marginBottom: "25px", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#495057", marginBottom: "5px" }}>Semester</label>
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid #ced4da", background: "#f8f9fa", minWidth: "180px" }}>
            {semesters.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* BARRA DE NAVEGACIÓN */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={navButtonStyle("Day")} onClick={() => setViewMode("Day")}>Day</button>
          <button style={navButtonStyle("Week")} onClick={() => setViewMode("Week")}>Week</button>
        </div>

        {/* CONTROLES DE FECHA (CON LÓGICA FUNCIONAL) */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px", color: "#2b4a8e", fontWeight: "bold", fontSize: "1.1rem" }}>
          <button
            onClick={() => handleNavigateDate("prev")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "#2b4a8e" }}
          >‹</button>

          {/* Muestra la fecha real calculada */}
          <span>
            {viewMode === "Week" ? "Week View (Mon-Fri)" : formattedDateHeader}
          </span>

          <button
            onClick={() => handleNavigateDate("next")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "#2b4a8e" }}
          >›</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#2b4a8e", fontWeight: "bold", fontSize: "0.9rem" }}>Calendar View</span>
          <div style={{ width: "40px", height: "22px", background: "#2b4a8e", borderRadius: "15px", position: "relative", display: "flex", alignItems: "center" }}>
            <div style={{ width: "16px", height: "16px", background: "white", borderRadius: "50%", position: "absolute", right: "3px" }}></div>
          </div>
        </div>
      </div>

      {/* REJILLA DINÁMICA */}
      {loading ? <p>Loading...</p> : (
        <div style={{ borderTop: "1px solid #eee", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <tbody>
              {/* HEADER DE LA TABLA (Muestra los días visibles) */}
              <tr>
                <td style={{width: "60px"}}></td>
                {visibleDays.map(day => (
                  <td key={day} style={{ padding: "10px", textAlign: "center", fontWeight: "bold", color: "#555", borderBottom: "2px solid #ddd" }}>
                    {day}
                  </td>
                ))}
              </tr>

              {hours.map(hour => (
                <tr key={hour}>
                  <td style={{ padding: "10px", textAlign: "center", color: "#333", fontSize: "0.8rem", fontWeight: "bold", borderRight: "1px solid #eee", borderBottom: "1px solid #f5f5f5" }}>
                    {hour}
                  </td>

                  {visibleDays.map(day => {
                    // Si es fin de semana y estamos en vista Day, mostramos mensaje o vacío
                    if (isWeekend(day) && viewMode === "Day") {
                      return <td key={day} style={{padding:"20px", textAlign:"center", color:"#999", borderBottom: "1px solid #f5f5f5"}}>Weekend</td>;
                    }

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
                            background: colors.bg, borderLeft: `4px solid ${colors.border}`,
                            borderRadius: "6px", height: "100%", padding: "6px 8px", position: "relative"
                          }}>
                            <div style={{ fontWeight: "bold", fontSize: "0.8rem", color: "#333", marginBottom: "2px" }}>{entry.module_name}</div>
                            <div style={{ fontSize: "0.7rem", color: "#666" }}>{entry.lecturer_name} <br/> <strong>📍 {entry.room_name}</strong></div>
                            <button onClick={(e) => handleDelete(entry.id, e)} style={{ position: "absolute", bottom: "5px", right: "5px", background: "none", border: "none", color: "#d32f2f", cursor: "pointer" }}>✕</button>
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

      {/* MODAL (Igual que antes) */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(2px)" }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", width: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#333" }}>Schedule Class</h3>
            <p style={{marginBottom:"15px"}}>Day: <strong>{newEntry.day}</strong> at {newEntry.time}</p>

            <label style={{display:"block", marginBottom:"5px", fontWeight:"600"}}>Module</label>
            <select style={{width:"100%", padding:"10px", marginBottom:"15px"}} value={newEntry.offered_module_id} onChange={e => setNewEntry({...newEntry, offered_module_id: e.target.value})}>
              <option value="">-- Select Module --</option>
              {offeredModules.map(m => <option key={m.id} value={m.id}>{m.module_name}</option>)}
            </select>

            <label style={{display:"block", marginBottom:"5px", fontWeight:"600"}}>Room</label>
            <select style={{width:"100%", padding:"10px", marginBottom:"25px"}} value={newEntry.room_id} onChange={e => setNewEntry({...newEntry, room_id: e.target.value})}>
              <option value="">-- Select Room --</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>

            <div style={{ textAlign: "right" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", marginRight:"10px" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "10px 20px", background: "#2b4a8e", color: "white", border: "none" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}