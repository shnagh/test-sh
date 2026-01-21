import { useEffect, useMemo, useState } from "react";

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
  title: { margin: 0, fontSize: "1.5rem" },
  searchBar: {
    padding: "8px 12px",
    width: "300px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginBottom: "15px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
  },
  thead: { background: "#f2f2f2", borderBottom: "2px solid #ccc" },
  th: { padding: "10px 15px", fontWeight: 600 },
  td: { padding: "10px 15px", borderBottom: "1px solid #eee" },
  btn: {
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    marginLeft: "5px",
  },
  primaryBtn: { background: "#007bff", color: "white", border: "none" },
  editBtn: { background: "#6c757d", color: "white", border: "none" },
  deleteBtn: { background: "#dc3545", color: "white", border: "none" },
  badge: (ok) => ({
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.8rem",
    background: ok ? "#d4edda" : "#f8d7da",
    color: ok ? "#155724" : "#721c24",
  }),
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "white",
    padding: "25px",
    borderRadius: "8px",
    width: "500px",
  },
};

export default function RoomOverview() {
  const [rooms, setRooms] = useState([]);
  const [query, setQuery] = useState("");
  const [formMode, setFormMode] = useState("overview"); // "overview" | "add" | "edit"
  const [editingId, setEditingId] = useState(null);

  const [draft, setDraft] = useState({
    name: "",
    type: "Lecture Classroom",
    capacity: "", // string for input
    status: true,
    equipment: "",
    location: "",
  });

  // 🔹 MOCK DATA (LOCAL) — schema: id, name, capacity, type, status, equipment, location
  useEffect(() => {
    setRooms([
      {
        id: 1,
        name: "A-101",
        type: "Computer Lab",
        capacity: 30,
        status: true,
        equipment: "PCs, Projector",
        location: "Building A, Floor 1",
      },
      {
        id: 2,
        name: "B-202",
        type: "Lecture Classroom",
        capacity: 50,
        status: false,
        equipment: null,
        location: "Building B, Floor 2",
      },
    ]);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rooms.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.type || "").toLowerCase().includes(q)
    );
  }, [rooms, query]);

  function openAdd() {
    setEditingId(null);
    setDraft({
      name: "",
      type: "Lecture Classroom",
      capacity: "",
      status: true,
      equipment: "",
      location: "",
    });
    setFormMode("add");
  }

  function openEdit(r) {
    setEditingId(r.id);
    setDraft({
      name: r.name || "",
      type: r.type || "Lecture Classroom",
      capacity: String(r.capacity ?? ""),
      status: !!r.status,
      equipment: r.equipment ?? "",
      location: r.location ?? "",
    });
    setFormMode("edit");
  }

  function save() {
    if (!draft.name || !draft.capacity) return alert("Name & capacity required");

    const cap = Number(draft.capacity);
    if (!Number.isFinite(cap) || cap <= 0) return alert("Capacity must be a number > 0");

    const normalized = {
      name: draft.name,
      type: draft.type,
      capacity: cap,
      status: draft.status,
      equipment: draft.equipment.trim() ? draft.equipment.trim() : null,
      location: draft.location.trim() ? draft.location.trim() : null,
    };

    if (formMode === "add") {
      setRooms([...rooms, { ...normalized, id: Date.now() }]);
    } else {
      setRooms(rooms.map((r) => (r.id === editingId ? { ...normalized, id: r.id } : r)));
    }

    setFormMode("overview");
  }

  function remove(id) {
    if (!window.confirm("Delete room?")) return;
    setRooms(rooms.filter((r) => r.id !== id));
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Room Overview</h2>
        <button style={{ ...styles.btn, ...styles.primaryBtn }} onClick={openAdd}>
          + New Room
        </button>
      </div>

      <input
        style={styles.searchBar}
        placeholder="Search rooms..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Capacity</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Equipment</th>
            <th style={styles.th}>Location</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td style={styles.td}>{r.id}</td>
              <td style={styles.td}>{r.name}</td>
              <td style={styles.td}>{r.type}</td>
              <td style={styles.td}>{r.capacity}</td>
              <td style={styles.td}>
                <span style={styles.badge(!!r.status)}>
                  {r.status ? "Available" : "Unavailable"}
                </span>
              </td>
              <td style={styles.td}>{r.equipment ?? "-"}</td>
              <td style={styles.td}>{r.location ?? "-"}</td>
              <td style={styles.td}>
                <button style={{ ...styles.btn, ...styles.editBtn }} onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button style={{ ...styles.btn, ...styles.deleteBtn }} onClick={() => remove(r.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(formMode === "add" || formMode === "edit") && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>{formMode === "add" ? "Create Room" : "Edit Room"}</h3>

            <input
              style={styles.searchBar}
              placeholder="Room name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />

            <select
              style={styles.searchBar}
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
            >
              <option>Lecture Classroom</option>
              <option>Computer Lab</option>
              <option>Seminar</option>
            </select>

            <input
              type="number"
              style={styles.searchBar}
              placeholder="Capacity"
              value={draft.capacity}
              onChange={(e) => setDraft({ ...draft, capacity: e.target.value })}
            />

            <label>
              <input
                type="checkbox"
                checked={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.checked })}
              />{" "}
              Available
            </label>

            <input
              style={styles.searchBar}
              placeholder="Equipment"
              value={draft.equipment}
              onChange={(e) => setDraft({ ...draft, equipment: e.target.value })}
            />

            <input
              style={styles.searchBar}
              placeholder="Location"
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />

            <div style={{ marginTop: 20 }}>
              <button onClick={() => setFormMode("overview")}>Cancel</button>
              <button style={{ marginLeft: 10 }} onClick={save}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
