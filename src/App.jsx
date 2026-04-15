import { useEffect, useState } from "react";
import { Box, Snackbar, Alert, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  getUsers, createUser, updateUser, deleteUser,
  getAttendanceRecords, createAttendanceRecord, updateAttendanceRecord, deleteAttendanceRecord,
} from "./services/api";
import translations from "./i18n";
import Sidebar from "./components/Layout/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import AttendancePage from "./pages/AttendancePage";
import ExportPage from "./pages/ExportPage";

// localStorage key for frontend-only position data
const POSITIONS_KEY = "userPositions";

function loadPositions() {
  try {
    return JSON.parse(localStorage.getItem(POSITIONS_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePositions(map) {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(map));
}

function App() {
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [positions, setPositions] = useState(loadPositions); // { [userId]: "Developer" }
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [darkMode, setDarkMode] = useState(true);
  const [lang, setLang] = useState("cs");
  const [activePage, setActivePage] = useState("dashboard");

  const t = (key) => translations[lang][key] ?? key;

  useEffect(() => {
    loadUsers();
    loadRecords();
  }, []);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      showSnackbar("Chyba při načítání uživatelů.", "error");
    }
  }

  async function handleCreateUser(formData) {
    const { position, ...apiData } = formData;
    try {
      const response = await createUser(apiData);
      if (!response.ok) {
        let msg = "Chyba registrace.";
        try {
          const data = await response.json();
          if (data?.errors) msg = Object.values(data.errors).join(" | ");
          else if (data?.title) msg = data.title;
        } catch {}
        showSnackbar(msg, "error");
        return false;
      }
      showSnackbar("Uživatel byl přidán.", "success");
      const fresh = await getUsers();
      setUsers(fresh);
      if (position) {
        const newest = fresh.reduce((a, b) => (b.id > a.id ? b : a), fresh[0]);
        if (newest) {
          const updated = { ...loadPositions(), [newest.id]: position };
          setPositions(updated);
          savePositions(updated);
        }
      }
      return true;
    } catch {
      showSnackbar("Chyba komunikace s API.", "error");
      return false;
    }
  }

  async function handleUpdateUser(id, data) {
    const { position, ...apiData } = data;
    try {
      await updateUser(id, apiData);
      showSnackbar("Uživatel upraven.", "success");
      if (position !== undefined) {
        const updated = { ...loadPositions(), [id]: position };
        setPositions(updated);
        savePositions(updated);
      }
      loadUsers();
    } catch {
      showSnackbar("Chyba editace.", "error");
    }
  }

  async function handleDeleteUser(id) {
    if (!window.confirm(t("confirmDeleteUser"))) return;
    await deleteUser(id);
    showSnackbar("Uživatel byl smazán.", "info");
    const updated = { ...loadPositions() };
    delete updated[id];
    setPositions(updated);
    savePositions(updated);
    loadUsers();
  }

  async function loadRecords() {
    try {
      const data = await getAttendanceRecords();
      setRecords(data);
    } catch {
      showSnackbar("Chyba při načítání docházky.", "error");
    }
  }

  async function handleCreateRecord(formData) {
    try {
      const response = await createAttendanceRecord(formData);
      if (!response.ok) {
        let msg = "Chyba při vytváření záznamu.";
        try {
          const data = await response.json();
          if (data?.errors) msg = Object.values(data.errors).join(" | ");
          else if (data?.title) msg = data.title;
        } catch {}
        showSnackbar(msg, "error");
        return false;
      }
      showSnackbar("Záznam byl přidán.", "success");
      loadRecords();
      return true;
    } catch {
      showSnackbar("Chyba komunikace s API.", "error");
      return false;
    }
  }

  async function handleUpdateRecord(id, data) {
    try {
      await updateAttendanceRecord(id, data);
      showSnackbar("Záznam byl upraven.", "success");
      loadRecords();
    } catch {
      showSnackbar("Chyba editace záznamu.", "error");
    }
  }

  async function handleDeleteRecord(id) {
    if (!window.confirm(t("confirmDeleteRecord"))) return;
    await deleteAttendanceRecord(id);
    showSnackbar("Záznam byl smazán.", "info");
    loadRecords();
  }

  function showSnackbar(message, severity = "success") {
    setSnackbar({ open: true, message, severity });
  }

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: "#1976d2" },
      background: {
        default: darkMode ? "#191b23" : "#f2f6fc",
        paper: darkMode ? "#23263b" : "#fff",
      },
    },
  });

  const commonProps = { t, lang, users, records, positions };

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage {...commonProps} />;
      case "users":
        return (
          <UsersPage
            {...commonProps}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      case "attendance":
        return (
          <AttendancePage
            {...commonProps}
            onCreateRecord={handleCreateRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        );
      case "export":
        return <ExportPage {...commonProps} />;
      default:
        return null;
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((m) => !m)}
          lang={lang}
          onToggleLang={setLang}
          t={t}
        />
        <Box sx={{ ml: "240px", p: 3, minHeight: "100vh", width: "calc(100% - 240px)" }}>
          {renderPage()}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
