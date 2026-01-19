import { useEffect, useState } from "react";
import api from "../api";

const styles = {
  container: { padding: "20px", fontFamily: "'Segoe UI', sans-serif", color: "#333", maxWidth: "100%" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "15px" },
  title: { margin: 0, fontSize: "1.5rem", color: "#333" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd", fontSize: "0.9rem" },
  thead: { background: "#f2f2f2", borderBottom: "2px solid #ccc" },
  th: { textAlign: "left", padding: "10px 15px", fontWeight: "600", color: "#ffffff" },
  td: { padding: "10px 15px", verticalAlign: "middle", borderBottom: "1px solid #eee" },
  // Buttons
  btn: { padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.9rem", marginLeft: "5px", background: "#007bff", color: "white" },
  editBtn: { background: "#6c757d", color: "white", padding: "6px 12px", borderRadius: "4px", border: "none", cursor: "pointer", marginRight: "5px" },
  deleteBtn: { background: "#dc3545", color: "white", padding: "6px 12px", borderRadius: "4px", border: "none", cursor: "pointer" },
  // Modal
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { background: "white", padding: "30px", borderRadius: "12px", width: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
  formGroup: { marginBottom: "20px" },
  label: { display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "0.95rem" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem", boxSizing: "border-box" },
  helper: { fontSize: "0.85rem", color: "#666", marginTop: "5px" }
};

export default function ConstraintOverview() {
  const [constraints, setConstraints] = useState([]);
  const [types, setTypes] = useState([]);
  const [targets, setTargets] = useState({ LECTURER: [], GROUP: [], MODULE: [], ROOM: [], GLOBAL: [{ id: 0, name: "Global (All)" }] });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Track if we are editing
  const [draft, setDraft] = useState(null);

  // Hardcoded options for the UI helpers
  const ROOM_TYPES = ["Lecture Classroom", "Computer Lab", "Game Design", "Seminar"];
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [cData, tData, lData, gData, mData, rData] = await Promise.all([
        api.getConstraints(), api.getConstraintTypes(),
        api.getLecturers(), api.getGroups(), api.getModules(), api.getRooms()
      ]);
      setConstraints(cData);
      setTypes(tData);
      setTargets(prev => ({
        ...prev,
        LECTURER: lData.map(x => ({ id: x.id, name: x.full_name })),
        GROUP: gData.map(x => ({ id: x.id, name: x.group_name })),
        MODULE: mData.map(x => ({ id: x.module_id, name: x.module_name })),
        ROOM: rData.map(x => ({ id: x.id, name: x.name })),
      }));
    } catch (e) { console.error(e); }
  }

  function openAdd() {
    setEditingId(null); // Clear editing ID
    setDraft({
      constraint_type_id: types[0]?.id || 1,
      hardness: "HARD",
      scope: "GLOBAL",
      target_id: 0,
      config: {}
    });
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditingId(c.id); // Set the ID we are editing
    setDraft({
      constraint_type_id: c.constraint_type_id,
      hardness: c.hardness,
      scope: c.scope,
      target_id: c.target_id,
      config: c.config || {} // Load existing config
    });
    setModalOpen(true);
  }

  async function save() {
    try {
      const payload = { ...draft, target_id: Number(draft.target_id) };

      if (editingId) {
        await api.updateConstraint(editingId, payload); // Update if ID exists
      } else {
        await api.createConstraint(payload); // Create if new
      }

      setModalOpen(false);
      loadData();
    } catch (e) { alert("Error saving constraint."); }
  }

  async function remove(id) {
    if(!window.confirm("Delete rule?")) return;
    await api.deleteConstraint(id);
    loadData();
  }

  // --- Dynamic Form Renderer ---
  const renderParameters = () => {
    const activeCode = types.find(t => t.id == draft.constraint_type_id)?.code;

    if (activeCode === "REQUIRED_ROOM_TYPE" || activeCode === "AVOID_ROOM_TYPE") {
        return (
            <div style={styles.formGroup}>
                <label style={styles.label}>Which Room Type?</label>
                <select
                    style={styles.input}
                    value={draft.config.room_type || ""}
                    onChange={e => setDraft({...draft, config: { room_type: e.target.value }})}
                >
                    <option value="">-- Select Type --</option>
                    {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
        );
    }

    if (activeCode === "TEACHER_UNAVAILABLE") {
        return (
            <div style={styles.formGroup}>
                <label style={styles.label}>Which Day?</label>
                <select
                    style={styles.input}
                    value={draft.config.day || ""}
                    onChange={e => setDraft({...draft, config: { day: e.target.value }})}
                >
                    <option value="">-- Select Day --</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
        );
    }

    if (activeCode === "GLOBAL_TIME_BLOCK") {
        return (
            <div style={{display:'flex', gap:'10px'}}>
                <div style={{flex:1}}>
                    <label style={styles.label}>Start Time</label>
                    <input type="time" style={styles.input} value={draft.config.start || ""} onChange={e => setDraft({...draft, config: {...draft.config, start: e.target.value}})} />
                </div>
                <div style={{flex:1}}>
                    <label style={styles.label}>End Time</label>
                    <input type="time" style={styles.input} value={draft.config.end || ""} onChange={e => setDraft({...draft, config: {...draft.config, end: e.target.value}})} />
                </div>
            </div>
        );
    }

    return (
        <div style={styles.formGroup}>
            <label style={styles.label}>Raw Configuration (JSON)</label>
            <textarea
                style={{...styles.input, height: '80px', fontFamily: 'monospace'}}
                value={JSON.stringify(draft.config)}
                onChange={e => {
                    try { setDraft({...draft, config: JSON.parse(e.target.value)}) }
                    catch(err) { /* ignore invalid json while typing */ }
                }}
            />
            <div style={styles.helper}>No specific UI for this rule yet. Edit raw JSON above.</div>
        </div>
    );
  };

  // --- Helpers ---
  const activeType = types.find(t => t.id == draft?.constraint_type_id);
  const scopeOptions = ["GLOBAL", "LECTURER", "GROUP", "MODULE", "ROOM"];
  const targetOptions = draft ? (targets[draft.scope] || []) : [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Scheduler Rules & Constraints</h2>
        <button style={styles.btn} onClick={openAdd}>+ Add Rule</button>
      </div>

      {constraints.length === 0 && <p>No rules defined yet. Click "+ Add Rule" to create one.</p>}

      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            <th style={styles.th}>Rule Type</th>
            <th style={styles.th}>Applies To</th>
            <th style={styles.th}>Details</th>
            <th style={styles.th}>Priority</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {constraints.map(c => {
            const typeName = types.find(t => t.id === c.constraint_type_id)?.code || "Unknown Rule";
            const targetName = (targets[c.scope] || []).find(t => t.id === c.target_id)?.name || "All";

            let details = Object.entries(c.config).map(([k, v]) => `${k}: ${v}`).join(", ");
            if (!details) details = "-";

            return (
              <tr key={c.id}>
                <td style={styles.td}><strong>{typeName}</strong></td>
                <td style={styles.td}>{c.scope}: {targetName}</td>
                <td style={styles.td}>{details}</td>
                <td style={styles.td}>
                    <span style={{
                        padding:'4px 8px', borderRadius:'4px', fontSize:'0.8rem', fontWeight:'bold',
                        background: c.hardness === "HARD" ? "#f8d7da" : "#d1e7dd",
                        color: c.hardness === "HARD" ? "#721c24" : "#0f5132"
                    }}>
                        {c.hardness}
                    </span>
                </td>
                <td style={styles.td}>
                  <button style={styles.editBtn} onClick={() => openEdit(c)}>Edit</button>
                  <button style={styles.deleteBtn} onClick={() => remove(c.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{marginTop:0}}>{editingId ? "Edit Constraint" : "Add Constraint"}</h3>

            {/* 1. Rule Type */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Rule Type</label>
                <select style={styles.input} value={draft.constraint_type_id} onChange={e => setDraft({...draft, constraint_type_id: e.target.value, config: {}})}>
                    {types.map(t => <option key={t.id} value={t.id}>{t.code}</option>)}
                </select>
                <div style={styles.helper}>{types.find(t=>t.id == draft.constraint_type_id)?.description}</div>
            </div>

            {/* 2. Scope & Target */}
            <div style={{display:'flex', gap:'15px', marginBottom:'20px'}}>
                <div style={{flex:1}}>
                    <label style={styles.label}>Applies To</label>
                    <select style={styles.input} value={draft.scope} onChange={e => setDraft({...draft, scope: e.target.value, target_id: 0})}>
                        {scopeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div style={{flex:1}}>
                    <label style={styles.label}>Target</label>
                    <select style={styles.input} value={draft.target_id} onChange={e => setDraft({...draft, target_id: e.target.value})}>
                        <option value={0}>-- Select --</option>
                        {targetOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            </div>

            {/* 3. Smart Parameters */}
            <div style={{background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #eee"}}>
                <h4 style={{marginTop: 0, marginBottom: "15px", fontSize: "0.9rem", color: "#555"}}>Rule Parameters</h4>
                {renderParameters()}
            </div>

            {/* 4. Hardness */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Priority</label>
                <select style={styles.input} value={draft.hardness} onChange={e => setDraft({...draft, hardness: e.target.value})}>
                    <option value="HARD">HARD (Must happen)</option>
                    <option value="SOFT">SOFT (Preference)</option>
                </select>
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                <button style={{...styles.btn, background:'#f8f9fa', border:'1px solid #ddd', color:'#333'}} onClick={() => setModalOpen(false)}>Cancel</button>
                <button style={styles.btn} onClick={save}>
                    {editingId ? "Save Changes" : "Create Rule"}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}