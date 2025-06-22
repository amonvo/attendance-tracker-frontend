import { useEffect, useState } from "react";

function App() {
  // ==== UŽIVATELÉ ====
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==== EDITACE UŽIVATELE ====
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    role: "user",
  });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // ==== DOCHÁZKA ====
  const [attendanceForm, setAttendanceForm] = useState({
    userId: "",
    date: "",
    checkIn: "",
    checkOut: "",
  });
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceSuccess, setAttendanceSuccess] = useState("");

  // Načti uživatele po načtení komponenty
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const resp = await fetch("https://localhost:7024/api/Users");
      setUsers(await resp.json());
    } catch (err) {
      setError("Chyba při načítání uživatelů: " + err);
    }
  }

  // === HANDLERY PRO REGISTRACI UŽIVATELE ===
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await fetch("https://localhost:7024/api/Users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(
          data.errors
            ? Object.values(data.errors).join(" | ")
            : "Registrace selhala."
        );
        return;
      }
      setForm({ username: "", email: "", password: "", role: "user" });
      setSuccess("Uživatel byl úspěšně zaregistrován!");
      loadUsers();
    } catch (err) {
      setError("Chyba komunikace s API: " + err.message);
    }
  }

  // === MAZÁNÍ UŽIVATELE ===
  async function handleDelete(id) {
    if (!window.confirm("Opravdu smazat uživatele?")) return;
    await fetch(`https://localhost:7024/api/Users/${id}`, { method: "DELETE" });
    loadUsers();
  }

  // === EDITACE UŽIVATELE ===
  function startEdit(user) {
    setEditUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
    });
    setEditError("");
    setEditSuccess("");
  }
  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }
  function cancelEdit() {
    setEditUser(null);
    setEditForm({ username: "", email: "", role: "user" });
    setEditError("");
    setEditSuccess("");
  }
  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");
    try {
      const resp = await fetch(`https://localhost:7024/api/Users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editUser.id,
          username: editForm.username,
          email: editForm.email,
          role: editForm.role,
          passwordHash: "", // Pokud neřešíš heslo, pošli prázdný string
        }),
      });
      if (!resp.ok) {
        setEditError("Editace selhala.");
        return;
      }
      setEditSuccess("Uživatel upraven.");
      setEditUser(null);
      loadUsers();
    } catch (err) {
      setEditError("Chyba: " + err.message);
    }
  }

  // === DOCHÁZKA (Attendance) ===
  function handleAttendanceChange(e) {
    setAttendanceForm({ ...attendanceForm, [e.target.name]: e.target.value });
  }
  async function handleAttendanceSubmit(e) {
    e.preventDefault();
    setAttendanceError("");
    setAttendanceSuccess("");
    try {
      const response = await fetch("https://localhost:7024/api/AttendanceRecords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(attendanceForm.userId),
          date: attendanceForm.date,
          checkIn: attendanceForm.checkIn,
          checkOut: attendanceForm.checkOut,
        }),
      });
      if (!response.ok) {
        setAttendanceError("Zápis docházky selhal.");
        return;
      }
      setAttendanceForm({
        userId: "",
        date: "",
        checkIn: "",
        checkOut: "",
      });
      setAttendanceSuccess("Docházka zapsána!");
    } catch (err) {
      setAttendanceError("Chyba komunikace s API: " + err.message);
    }
  }

  return (
    <div style={{ padding: 32, fontFamily: "sans-serif", maxWidth: 600 }}>
      <h1>Seznam uživatelů</h1>
      <ul>
        {users.length === 0 && <li>Žádní uživatelé</li>}
        {users.map((user) => (
          <li key={user.id}>
            <strong>{user.username}</strong> ({user.email}) – Role: {user.role}{" "}
            <button
              style={{ marginLeft: 8, background: "#5096ff", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
              onClick={() => startEdit(user)}
            >
              Editovat
            </button>
            <button
              style={{ marginLeft: 8, background: "#ff4c4c", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
              onClick={() => handleDelete(user.id)}
            >
              Smazat
            </button>
          </li>
        ))}
      </ul>

      {/* ==== EDITACE UŽIVATELE ==== */}
      {editUser && (
        <div style={{ margin: "24px 0" }}>
          <h2>Editace uživatele</h2>
          <form
            onSubmit={handleEditSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}
          >
            <input
              name="username"
              placeholder="Jméno"
              value={editForm.username}
              onChange={handleEditChange}
              required
              minLength={3}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={editForm.email}
              onChange={handleEditChange}
              required
            />
            <select name="role" value={editForm.role} onChange={handleEditChange}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <div>
              <button type="submit" style={{ marginRight: 10 }}>Uložit změny</button>
              <button type="button" onClick={cancelEdit}>Zrušit editaci</button>
            </div>
          </form>
          {editError && <div style={{ color: "red" }}>{editError}</div>}
          {editSuccess && <div style={{ color: "green" }}>{editSuccess}</div>}
        </div>
      )}

      {/* ==== REGISTRACE UŽIVATELE ==== */}
      <h2>Přidat uživatele</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <input
          name="username"
          placeholder="Uživatelské jméno"
          value={form.username}
          onChange={handleChange}
          required
          minLength={3}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Heslo"
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
        />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button type="submit">Registrovat</button>
      </form>
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: 8 }}>{success}</div>}

      {/* ==== FORMULÁŘ DOCHÁZKY ==== */}
      <h2>Přidat docházku</h2>
      <form
        onSubmit={handleAttendanceSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}
      >
        <select
          name="userId"
          value={attendanceForm.userId}
          onChange={handleAttendanceChange}
          required
        >
          <option value="">Vyberte uživatele</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
        <input
          name="date"
          type="date"
          value={attendanceForm.date}
          onChange={handleAttendanceChange}
          required
        />
        <input
          name="checkIn"
          type="time"
          value={attendanceForm.checkIn}
          onChange={handleAttendanceChange}
          required
        />
        <input
          name="checkOut"
          type="time"
          value={attendanceForm.checkOut}
          onChange={handleAttendanceChange}
          required
        />
        <button type="submit">Zapsat docházku</button>
      </form>
      {attendanceError && <div style={{ color: "red" }}>{attendanceError}</div>}
      {attendanceSuccess && <div style={{ color: "green" }}>{attendanceSuccess}</div>}
    </div>
  );
}

export default App;
