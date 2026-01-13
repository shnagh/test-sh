import { useEffect, useMemo, useState } from "react";
import api from "../api";

// --- CONSISTENT STYLES ---
const styles = {
  container: {
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#333",
    maxWidth: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #ccc",
    paddingBottom: "15px",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    color: "#333",
  },
  searchBar: {
    padding: "8px 12px",
    width: "300px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "0.95rem",
    marginBottom: "15px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
  },
  thead: {
    background: "#f2f2f2",
    borderBottom: "2px solid #ccc",
  },
  th: {
    textAlign: "left",
    padding: "10px 15px",
    fontWeight: "600",
    color: "#ffffff",
  },
  tr: {
    borderBottom: "1px solid #eee",
  },
  td: {
    padding: "10px 15px",
    verticalAlign: "middle",
  },
  // Status Badge for "Available"
  statusBadge: (isAvailable) => ({
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    backgroundColor: isAvailable ? "#d4edda" : "#f8d7da",
    color: isAvailable ? "#155724" : "#721c24",
    border: isAvailable ? "1px solid #c3e6cb" : "1px solid #f5c6cb",
    textAlign: "center",
    minWidth: "60px",
  }),
  btn: {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "1px solid transparent",
    cursor: "pointer",
    fontSize: "0.9rem",
    marginLeft: "5px",
  },
  primaryBtn: { background: "#007bff", color: "white" },
  editBtn: { background: "#6c757d", color: "white" },
  deleteBtn: { background: "#dc3545", color: "white" },
  modalOverlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
  },
  modalContent: {
    background: "white", padding: "25px", borderRadius: "8px",
    width: "500px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
  },
  formGroup: { marginBottom: "15px" },
  label: { display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "0.9rem" },
  input: {
    width: "100%", padding: "8px", borderRadius: "4px",
    border: "1px solid #ccc", fontSize: "1rem", boxSizing: "border-box",
  },
  checkboxWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
  },
};

export default function RoomOverview() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(""); // Added search state
  const [formMode, setFormMode] = useState("overview");
  const [editingId, setEditingId] = useState(null);

  const [draft, setDraft] = useState({
    name: "",
    capacity: "",
    type: "Lecture Classroom",
    available: true,
  });

  async function loadRooms() {
    setLoading(true);
    try {
      const data = await api.getRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      alert("Error loading rooms: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  function openAdd() {
    setEditingId(null);
    setDraft({
      name: "",
      capacity: "",
      type: "Lecture Classroom",
      available: true,
    });
    setFormMode("add");
  }

  function openEdit(r) {
    setEditingId(r.id);
    setDraft({
      name: r.name,
      capacity: r.capacity,
      type: r.type,
      available: r.available,
    });
    setFormMode("edit");
  }

  async function save() {
    if (!draft.name.trim() || !draft.capacity) {
      return alert("Name and Capacity are required.");
    }

    const payload = {
      name: draft.name.trim(),
      capacity: Number(draft.capacity),
      type: draft.type,
      available: !!draft.available,
    };

    try {
      if (formMode === "add") {
        await api.createRoom(payload);
      } else {
        await api.updateRoom(editingId, payload);
      }
      await loadRooms();
      setFormMode("overview");
    } catch (e) {
      console.error(e);
      alert("Backend error while saving room.");
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this room?")) return;
    try {
      await api.deleteRoom(id);
      loadRooms();
    } catch (e) {
      console.error(e);
      alert("Backend error while deleting room.");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q)
    );
  }, [rooms, query]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Room Overview</h2>
        <button style={{...styles.btn, ...styles.primaryBtn}} onClick={openAdd}>
          + New Room
        </button>
      </div>

      <input
        style={styles.searchBar}
        placeholder="Search rooms..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading ? <p>Loading...</p> : (
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>Room Name</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Capacity</th>
              <th style={{...styles.th, textAlign:'center'}}>Status</th>
              <th style={{...styles.th, textAlign:'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} style={styles.tr}>
                <td style={styles.td}><strong>{r.name}</strong></td>
                <td style={styles.td}>{r.type}</td>
                <td style={styles.td}>{r.capacity}</td>
                <td style={{...styles.td, textAlign:'center'}}>
                  <span style={styles.statusBadge(r.available)}>
                    {r.available ? 'Available' : 'Occupied'}
                  </span>
                </td>
                <td style={{...styles.td, textAlign:'right'}}>
                  <button style={{...styles.btn, ...styles.editBtn}} onClick={() => openEdit(r)}>
                    Edit
                  </button>
                  <button style={{...styles.btn, ...styles.deleteBtn}} onClick={() => remove(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* --- MODAL --- */}
      {(formMode === "add" || formMode === "edit") && (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                    <h3 style={{margin:0}}>{formMode === "add" ? "Create Room" : "Edit Room"}</h3>
                    <button onClick={() => setFormMode("overview")} style={{border:'none', background:'transparent', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Room Name</label>
                    <input
                      style={styles.input}
                      value={draft.name}
                      onChange={e => setDraft({...draft, name: e.target.value})}
                      placeholder="e.g. A-101"
                    />
                </div>

                <div style={{display:'flex', gap:'15px', marginBottom:'15px'}}>
                    <div style={{flex:1}}>
                        <label style={styles.label}>Type</label>
                        <select
                          style={styles.input}
                          value={draft.type}
                          onChange={e => setDraft({...draft, type: e.target.value})}
                        >
                          <option value="Lecture Classroom">Lecture Classroom</option>
                          <option value="Computer Lab">Computer Lab</option>
                          <option value="Game Design">Game Design</option>
                          <option value="Seminar">Seminar</option>
                        </select>
                    </div>
                    <div style={{flex:1}}>
                        <label style={styles.label}>Capacity</label>
                        <input
                          type="number"
                          style={styles.input}
                          value={draft.capacity}
                          onChange={e => setDraft({...draft, capacity: e.target.value})}
                          placeholder="e.g. 30"
                        />
                    </div>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.checkboxWrapper}>
                        <input
                            type="checkbox"
                            checked={draft.available}
                            onChange={e => setDraft({...draft, available: e.target.checked})}
                        />
                        Room is currently available
                    </label>
                </div>

                <div style={{marginTop: '25px', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                    <button style={{...styles.btn, background:'#f8f9fa', border:'1px solid #ddd'}} onClick={() => setFormMode("overview")}>Cancel</button>
                    <button style={{...styles.btn, ...styles.primaryBtn}} onClick={save}>
                        {formMode === "add" ? "Create" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}