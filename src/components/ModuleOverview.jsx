import React, { useState, useEffect, useMemo } from "react";
import api from "../api";

// --- STYLES (Keep existing styles) ---
const styles = {
  container: { padding: "20px", fontFamily: "'Inter', sans-serif", color: "#333", maxWidth: "1200px", margin: "0 auto" },
  controlsBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "15px", flexWrap: "wrap" },
  searchBar: { padding: "10px 15px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", width: "100%", maxWidth: "350px", background: "white", outline: "none" },
  listContainer: { display: "flex", flexDirection: "column", gap: "12px" },
  listHeader: { display: "grid", gridTemplateColumns: "80px 2fr 1.5fr 80px 100px 60px 1.2fr 1.2fr 110px", gap: "15px", padding: "0 25px", color: "#94a3b8", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" },
  listCard: { background: "white", borderRadius: "8px", display: "grid", gridTemplateColumns: "80px 2fr 1.5fr 80px 100px 60px 1.2fr 1.2fr 110px", alignItems: "center", padding: "16px 25px", gap: "15px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  codeText: { fontWeight: "700", color: "#3b82f6" },
  nameText: { fontWeight: "600", color: "#1e293b" },
  actionContainer: { display: "flex", gap: "8px", justifyContent: "flex-end" },
  actionBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" },
  editBtn: { background: "#e2e8f0", color: "#475569" },
  deleteBtn: { background: "#fee2e2", color: "#ef4444" },
  primaryBtn: { background: "#3b82f6", color: "white", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", border: "none" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#ffffff", padding: "30px", borderRadius: "12px", width: "650px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" },
  label: { display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "0.85rem", color: "#64748b" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "15px", boxSizing: "border-box" },
  select: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", marginBottom: "15px" },
};

const STANDARD_ROOM_TYPES = ["Lecture Classroom", "Computer Lab", "Seminar"];
const ASSESSMENT_TYPES = ["Written Exam", "Presentation", "Project", "Report"];
const CATEGORY_TYPES = ["Core", "Shared", "Elective"];

export default function ModuleOverview({ onNavigate }) {
  // --- 1. SUPER FLEXIBLE PERMISSION LOGIC ---
  const rawRole = localStorage.getItem("userRole") || "";
  // Check for 'hosp' OR 'head of program'
  const isHoSP = rawRole.toLowerCase().includes("hosp") || rawRole.toLowerCase().includes("head");
  const isAdmin = rawRole.toLowerCase().includes("admin") || rawRole.toLowerCase().includes("pm");

  const managedProgramIds = useMemo(() => {
    try {
      const raw = localStorage.getItem("managedProgramIds");
      const parsed = raw ? JSON.parse(raw) : [];
      // Force everything to String to avoid 1 !== "1" issues
      return Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
    } catch (e) { return []; }
  }, []);

  const checkManagePermission = (module) => {
    if (isAdmin) return true;
    if (isHoSP) {
      // If module is not assigned to a program, HoSP cannot edit it
      if (!module.program_id) return false;
      // Strict String check
      return managedProgramIds.includes(String(module.program_id));
    }
    return false;
  };

  // --- 2. STATE ---
  const [modules, setModules] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [customRoomTypes, setCustomRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [formMode, setFormMode] = useState("overview");
  const [editingCode, setEditingCode] = useState(null);
  const [draft, setDraft] = useState({
    module_code: "", name: "", ects: 5, room_type: "Lecture Classroom", semester: 1,
    assessment_type: "Written Exam", category: "Core", program_id: "", specialization_ids: []
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modData, progData, specData, roomData] = await Promise.all([
        api.getModules(), api.getPrograms(), api.getSpecializations(), api.getRooms()
      ]);
      setModules(modData || []);
      setPrograms(progData || []);
      setSpecializations(specData || []);
      const existingCustom = (roomData || []).map(r => r.type).filter(t => t && !STANDARD_ROOM_TYPES.includes(t));
      setCustomRoomTypes([...new Set(existingCustom)].sort());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(query.toLowerCase()) || 
    m.module_code.toLowerCase().includes(query.toLowerCase())
  );

  const openAdd = () => {
    setDraft({ module_code: "", name: "", ects: 5, room_type: "Lecture Classroom", semester: 1, assessment_type: "Written Exam", category: "Core", program_id: "", specialization_ids: [] });
    setFormMode("add");
  };

  const openEdit = (m) => {
    setEditingCode(m.module_code);
    setDraft({ ...m, program_id: m.program_id ? String(m.program_id) : "", specialization_ids: (m.specializations || []).map(s => s.id) });
    setFormMode("edit");
  };

  const save = async () => {
    try {
      const payload = { ...draft, ects: parseInt(draft.ects), semester: parseInt(draft.semester), program_id: draft.program_id ? parseInt(draft.program_id) : null };
      if (formMode === "add") await api.createModule(payload);
      else await api.updateModule(editingCode, payload);
      loadData();
      setFormMode("overview");
    } catch (e) { alert("Error saving."); }
  };

  return (
    <div style={styles.container}>
      {/* 3. THE DEBUG BOX (Delete this once working) */}
      <div style={{background: '#fefce8', border: '1px solid #fef08a', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.8rem'}}>
        <strong>Status:</strong> Role: {rawRole} | Is HoSP: {isHoSP ? "✅" : "❌"} | Managed IDs: {JSON.stringify(managedProgramIds)}
      </div>

      <div style={styles.controlsBar}>
        <input style={styles.searchBar} placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} />
        {(isAdmin || isHoSP) && <button style={styles.primaryBtn} onClick={openAdd}>+ New Module</button>}
      </div>

      <div style={styles.listHeader}>
        <div>Code</div><div>Name</div><div>Prog ID</div><div>Sem</div><div>ECTS</div><div>Room</div><div style={{textAlign:'right'}}>Action</div>
      </div>

      <div style={styles.listContainer}>
        {filteredModules.map(m => {
          const canManage = checkManagePermission(m);
          return (
            <div key={m.module_code} style={styles.listCard}>
              <div style={styles.codeText}>{m.module_code}</div>
              <div style={styles.nameText}>{m.name}</div>
              <div style={{color: '#64748b'}}>ID: {m.program_id || "Global"}</div>
              <div style={{textAlign:'center'}}>{m.semester}</div>
              <div style={{textAlign:'center'}}>{m.ects}</div>
              <div style={{fontSize:'0.85rem'}}>{m.room_type}</div>
              <div style={styles.actionContainer}>
                {canManage ? (
                  <>
                    <button style={{...styles.actionBtn, ...styles.editBtn}} onClick={() => openEdit(m)}>Edit</button>
                    <button style={{...styles.actionBtn, ...styles.deleteBtn}} onClick={() => { setModuleToDelete(m); setShowDeleteModal(true); }}>Del</button>
                  </>
                ) : (
                  <span style={{fontSize:'0.65rem', color:'#cbd5e1', fontWeight:'700'}}>READ ONLY</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL (ADD/EDIT) */}
      {(formMode === "add" || formMode === "edit") && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>{formMode === "add" ? "Create Module" : "Edit Module"}</h3>
            <label style={styles.label}>Module Code</label>
            <input style={styles.input} value={draft.module_code} onChange={e => setDraft({...draft, module_code: e.target.value})} disabled={formMode === "edit"} />
            
            <label style={styles.label}>Program Owner</label>
            <select style={styles.select} value={draft.program_id} onChange={e => setDraft({...draft, program_id: e.target.value})}>
              <option value="">-- Global --</option>
              {programs.map(p => {
                const forbidden = isHoSP && !managedProgramIds.includes(String(p.id));
                return <option key={p.id} value={p.id} disabled={forbidden}>{p.name} {forbidden ? "(Locked)" : ""}</option>
              })}
            </select>

            <button style={styles.btn} onClick={() => setFormMode("overview")}>Cancel</button>
            <button style={{...styles.btn, ...styles.primaryBtn, marginLeft: '10px'}} onClick={save}>Save</button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION (Not shown for brevity, same as yours) */}
    </div>
  );
}