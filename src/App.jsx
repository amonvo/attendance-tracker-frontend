import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { Grid } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import CountUp from "react-countup";




function App() {
  // === Stav uživatelů a formulářů ===
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user"
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    username: "",
    email: "",
    role: "user"
  });

  // Nové stavy pro filtrování, hledání a stránkování:
  const [search, setSearch] = useState("");            // text pro vyhledávání
  const [roleFilter, setRoleFilter] = useState("");    // filtr podle role
  const [currentPage, setCurrentPage] = useState(1);   // aktuální stránka
  const usersPerPage = 20;                              // kolik uživatelů na stránku
  const [darkMode, setDarkMode] = useState(true); // výchozí tmavý režim


  const adminCount = users.filter(u => u.role === "admin").length;
  const userCount = users.filter(u => u.role === "user").length;
  const totalCount = users.length;

  const pieData = [
    { name: "Admin", value: adminCount },
    { name: "User", value: userCount }
  ];

  const chartColors = ["#1976d2", "#b0bec5"];

  const sortedUsers = [...users].sort((a, b) => b.id - a.id);
  const newestUsers = sortedUsers.slice(0, 3);

  const lastUser = sortedUsers[0];

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const resp = await fetch("https://localhost:7024/api/Users");
      setUsers(await resp.json());
    } catch (e) {
      setSnackbar({ open: true, message: "Chyba při načítání uživatelů.", severity: "error" });
    }
  }

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch("https://localhost:7024/api/Users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        let msg = "Chyba registrace.";
        try {
          const data = await response.json();
          if (data && data.errors) {
            msg = Object.values(data.errors).join(" | ");
          } else if (data && data.title) {
            msg = data.title;
          }
        } catch {
          // chyba parsování
        }
        setSnackbar({ open: true, message: msg, severity: "error" });
        return;
      }

      setForm({ username: "", email: "", password: "", role: "user" });
      setSnackbar({ open: true, message: "Uživatel byl přidán.", severity: "success" });

      // DŮLEŽITÉ:
      await loadUsers();         // Nech uživatele znovu načíst
      setTimeout(() => setCurrentPage(1), 0); // Pak skoč na první stránku (až po updatu users)
    } catch (e) {
      setSnackbar({ open: true, message: "Chyba komunikace s API.", severity: "error" });
    }
  }



  async function handleDelete(id) {
    if (!window.confirm("Opravdu smazat uživatele?")) return;
    await fetch(`https://localhost:7024/api/Users/${id}`, { method: "DELETE" });
    setSnackbar({ open: true, message: "Uživatel byl smazán.", severity: "info" });
    loadUsers();
  }

  function openEditDialog(user) {
    setEditForm({ ...user });
    setEditDialogOpen(true);
  }

  function closeEditDialog() {
    setEditDialogOpen(false);
    setEditForm({ id: null, username: "", email: "", role: "user" });
  }

  function handleEditFormChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function handleEditFormSubmit(e) {
    e.preventDefault();
    try {
      await fetch(`https://localhost:7024/api/Users/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          passwordHash: "" // Neměníme heslo
        })
      });
      setSnackbar({ open: true, message: "Uživatel upraven.", severity: "success" });
      closeEditDialog();
      loadUsers();
    } catch {
      setSnackbar({ open: true, message: "Chyba editace.", severity: "error" });
    }
  }

  // Filtrování a vyhledávání
  const filteredUsers = users
    .filter(
      (user) =>
        (!roleFilter || user.role === roleFilter) &&
        (user.username.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()))
    );

  // Stránkování
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const pageCount = Math.ceil(filteredUsers.length / usersPerPage);


  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#1976d2"
      },
      background: {
        default: darkMode ? "#191b23" : "#f2f6fc",
        paper: darkMode ? "#23263b" : "#fff"
      }
    }
  });


  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* <pre>{JSON.stringify(users, null, 2)}</pre>
        <pre>{JSON.stringify(currentUsers, null, 2)}</pre> */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          <Brightness7Icon />
          <Switch
            checked={darkMode}
            onChange={() => setDarkMode((m) => !m)}
            color="primary"
            inputProps={{ "aria-label": "přepínač tmavého/světlého režimu" }}
          />
          <Brightness4Icon />
        </Box>
        {/* DASHBOARD / STATISTIKY */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Počet uživatelů (animovaný čítač) */}
          <Grid item xs={12} md={3}>
            <Paper elevation={4} sx={{ textAlign: "center", py: 2.5, background: "var(--bg-card)" }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
                Celkový počet uživatelů
              </Typography>
              <Typography variant="h3" sx={{ mt: 1, mb: 0 }}>
                <CountUp end={totalCount} duration={1.2} />
              </Typography>
            </Paper>
          </Grid>

          {/* Pie chart: Admin vs User */}
          <Grid item xs={12} md={4}>
            <Paper elevation={4} sx={{ textAlign: "center", py: 2.5, background: "var(--bg-card)" }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.7, mb: 2 }}>
                Admini vs. Uživatelé
              </Typography>
              <Box sx={{ width: "100%", height: 140, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <ResponsiveContainer width="90%" height={120}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={48}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={chartColors[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Nejnovější uživatelé */}
          <Grid item xs={12} md={5}>
            <Paper elevation={4} sx={{ py: 2.5, px: 2.5, background: "var(--bg-card)" }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
                Nejnovější uživatelé
              </Typography>
              <Box sx={{ mt: 1 }}>
                {newestUsers.length === 0 && <Typography fontSize="1.1em">Žádní uživatelé</Typography>}
                {newestUsers.map((u) => (
                  <Box key={u.id} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                    <Avatar
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=random&color=fff`}
                      sx={{ width: 32, height: 32, fontWeight: "bold" }}
                    >
                      {u.username[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{u.username}</Typography>
                      <Typography sx={{ fontSize: "0.97em", opacity: 0.7 }}>{u.email}</Typography>
                    </Box>
                    <Chip
                      label={u.role}
                      size="small"
                      sx={{
                        ml: 2,
                        bgcolor: u.role === "admin" ? "#1976d2" : "#b0bec5",
                        color: u.role === "admin" ? "#fff" : "#222",
                        fontWeight: 600,
                        fontSize: "0.8em"
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Poslední aktivita */}
        <Paper elevation={4} sx={{ mb: 3, p: 2, background: "var(--bg-card)" }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
            Poslední registrace
          </Typography>
          {lastUser ? (
            <Typography sx={{ fontWeight: 600, mt: 0.8 }}>
              {lastUser.username} ({lastUser.email}) – <span style={{ color: "#7ba4ff" }}>ID: {lastUser.id}</span>
            </Typography>
          ) : (
            <Typography sx={{ mt: 0.8 }}>Zatím žádná registrace.</Typography>
          )}
        </Paper>

        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Správa uživatelů
        </Typography>


        {/* Blok pro hledání a filtr */}
        <Paper
          elevation={5}
          sx={{
            display: "flex",
            gap: 2,
            mb: 4,
            px: 3,
            py: 2,
            alignItems: "center",
            background: "#22293a",
            borderRadius: 4,
            maxWidth: 650,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)"
          }}
        >

          <TextField
            label="Hledat uživatele"
            variant="outlined"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            sx={{ background: "#f5f5f5", borderRadius: 1 }}
          />
          <FormControl sx={{ minWidth: 140, background: "#f5f5f5", borderRadius: 1 }}>
            <InputLabel id="role-filter-label">Role</InputLabel>
            <Select
              labelId="role-filter-label"
              value={roleFilter}
              label="Role"
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <MenuItem value="">Všechny</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </Paper>


        {/* Seznam uživatelů */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Uživatelé
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Jméno</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Akce</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentUsers.map((u) => (
                <TableRow key={u.id} sx={{ height: 64 }}>
                  {/* Jméno + Avatar + Badge v jedné buňce */}
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=random&color=fff`}
                        sx={{ width: 38, height: 38, fontWeight: "bold" }}
                      >
                        {u.username[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {u.username}
                        </Typography>
                        <Chip
                          label={u.role}
                          size="small"
                          sx={{
                            bgcolor: u.role === "admin" ? "#1976d2" : "#b0bec5",
                            color: u.role === "admin" ? "#fff" : "#222",
                            height: 22,
                            mt: 0.5,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            fontSize: "0.78em",
                            px: 1.3,
                          }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                  </TableCell>
                  {/* Skrytá duplikace role – stačí vpravo jako badge! */}
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => openEditDialog(u)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(u.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {currentUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>Žádní uživatelé</TableCell>
                </TableRow>
              )}
            </TableBody>

          </Table>
        </Paper>

        {/* Přidat uživatele */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Přidat uživatele
          </Typography>
          <Box component="form" onSubmit={handleFormSubmit} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Uživatelské jméno"
              name="username"
              value={form.username}
              onChange={handleFormChange}
              required
              sx={{ flex: "1 1 180px" }}
            />
            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleFormChange}
              required
              type="email"
              sx={{ flex: "1 1 180px" }}
            />
            <TextField
              label="Heslo"
              name="password"
              value={form.password}
              onChange={handleFormChange}
              required
              type="password"
              sx={{ flex: "1 1 120px" }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                label="Role"
                value={form.role}
                onChange={handleFormChange}
              >
                <MenuItem value="user">user</MenuItem>
                <MenuItem value="admin">admin</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" type="submit" sx={{ height: 56 }}>
              Registrovat
            </Button>
          </Box>
        </Paper>

        {/* Edit dialog */}
        <Dialog open={editDialogOpen} onClose={closeEditDialog}>
          <DialogTitle>Editace uživatele</DialogTitle>
          <Box component="form" onSubmit={handleEditFormSubmit}>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 350 }}>
              <TextField
                label="Uživatelské jméno"
                name="username"
                value={editForm.username}
                onChange={handleEditFormChange}
                required
              />
              <TextField
                label="Email"
                name="email"
                value={editForm.email}
                onChange={handleEditFormChange}
                required
                type="email"
              />
              <FormControl>
                <InputLabel id="edit-role-label">Role</InputLabel>
                <Select
                  labelId="edit-role-label"
                  name="role"
                  label="Role"
                  value={editForm.role}
                  onChange={handleEditFormChange}
                >
                  <MenuItem value="user">user</MenuItem>
                  <MenuItem value="admin">admin</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeEditDialog}>Zrušit</Button>
              <Button type="submit" variant="contained">Uložit</Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* Snackbar (oznámení) */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;
