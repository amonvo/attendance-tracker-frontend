import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Avatar,
  Chip,
  Fade,
} from "@mui/material";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const POSITIONS = ["Developer", "Manager", "HR", "Analyst", "Designer", "DevOps", "QA", "Other"];

const EMPTY_EDIT = { id: null, username: "", email: "", role: "user", position: "" };

export default function UsersPage({ t, users, positions, onCreateUser, onUpdateUser, onDeleteUser }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [addForm, setAddForm] = useState({ username: "", email: "", password: "", role: "user", position: "" });

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);

  const filteredUsers = users.filter((u) => {
    const pos = positions[u.id] || "";
    return (
      (!roleFilter || u.role === roleFilter) &&
      (!positionFilter || pos === positionFilter) &&
      (u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const paginated = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  function handleChangePage(_, newPage) {
    setPage(newPage);
  }
  function handleChangeRowsPerPage(e) {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }
  function handleFilterChange(setter) {
    return (val) => { setter(val); setPage(0); };
  }

  function handleAddChange(e) {
    setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    const ok = await onCreateUser(addForm);
    if (ok) setAddForm({ username: "", email: "", password: "", role: "user", position: "" });
  }

  function openEdit(user) {
    setEditForm({ ...user, position: positions[user.id] || "" });
    setEditOpen(true);
  }
  function closeEdit() {
    setEditOpen(false);
    setEditForm(EMPTY_EDIT);
  }
  function handleEditChange(e) {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }
  async function handleEditSubmit(e) {
    e.preventDefault();
    await onUpdateUser(editForm.id, { ...editForm, passwordHash: "" });
    closeEdit();
  }

  return (
    <Fade in timeout={400}>
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
          gutterBottom
          sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 2, mb: 3 }}
        >
          {t("usersTitle")}
        </Typography>

        {/* Summary stat chips */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: t("totalUsers"), value: users.length, color: "primary.main" },
            { label: t("totalAdmins"), value: users.filter((u) => u.role === "admin").length, color: "warning.main" },
            { label: t("totalRegularUsers"), value: users.filter((u) => u.role === "user").length, color: "success.main" },
          ].map(({ label, value, color }) => (
            <Paper key={label} elevation={2} sx={{ px: 3, py: 1.5, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 110 }}>
              <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Filters */}
        <Paper elevation={2} sx={{ p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            label={t("searchUser")}
            value={search}
            onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>{t("role")}</InputLabel>
            <Select value={roleFilter} label={t("role")} onChange={(e) => handleFilterChange(setRoleFilter)(e.target.value)}>
              <MenuItem value="">{t("allRoles")}</MenuItem>
              <MenuItem value="user">{t("user")}</MenuItem>
              <MenuItem value="admin">{t("admin")}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("position")}</InputLabel>
            <Select value={positionFilter} label={t("position")} onChange={(e) => handleFilterChange(setPositionFilter)(e.target.value)}>
              <MenuItem value="">{t("allPositions")}</MenuItem>
              {POSITIONS.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {/* Table */}
        <Paper elevation={3} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("name")}</TableCell>
                <TableCell>{t("email")}</TableCell>
                <TableCell>{t("position")}</TableCell>
                <TableCell align="right">{t("actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((u, i) => (
                <TableRow key={u.id} sx={{ bgcolor: i % 2 === 1 ? "action.hover" : "transparent", height: 64 }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=random&color=fff`}
                        sx={{ width: 36, height: 36 }}
                      >
                        {u.username[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>{u.username}</Typography>
                        <Chip
                          label={u.role}
                          size="small"
                          sx={{
                            bgcolor: u.role === "admin" ? "primary.main" : "action.selected",
                            color: u.role === "admin" ? "primary.contrastText" : "text.primary",
                            height: 20,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.8,
                          }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{positions[u.id] || "–"}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" size="small" onClick={() => openEdit(u)}><EditIcon /></IconButton>
                    <IconButton color="error" size="small" onClick={() => onDeleteUser(u.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 6, textAlign: "center", border: 0 }}>
                    <PersonOffIcon sx={{ fontSize: 56, color: "text.disabled", display: "block", mx: "auto", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={500}>{t("noUsers")}</Typography>
                    <Typography variant="body2" color="text.disabled">{t("noUsersHint")}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage={t("rowsPerPage")}
          />
        </Paper>

        {/* Add user form */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>{t("addUser")}</Typography>
          <Box component="form" onSubmit={handleAddSubmit} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField label={t("name")} name="username" value={addForm.username} onChange={handleAddChange} required size="small" sx={{ flex: "1 1 160px" }} />
            <TextField label={t("email")} name="email" value={addForm.email} onChange={handleAddChange} required type="email" size="small" sx={{ flex: "1 1 180px" }} />
            <TextField label={t("password")} name="password" value={addForm.password} onChange={handleAddChange} required type="password" size="small" sx={{ flex: "1 1 140px" }} />
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>{t("role")}</InputLabel>
              <Select name="role" label={t("role")} value={addForm.role} onChange={handleAddChange}>
                <MenuItem value="user">{t("user")}</MenuItem>
                <MenuItem value="admin">{t("admin")}</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t("position")}</InputLabel>
              <Select name="position" label={t("position")} value={addForm.position} onChange={handleAddChange}>
                <MenuItem value="">–</MenuItem>
                {POSITIONS.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" type="submit" sx={{ height: 40 }}>{t("register")}</Button>
          </Box>
        </Paper>

        {/* Edit dialog */}
        <Dialog open={editOpen} onClose={closeEdit}>
          <DialogTitle>{t("editUser")}</DialogTitle>
          <Box component="form" onSubmit={handleEditSubmit}>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 360 }}>
              <TextField label={t("name")} name="username" value={editForm.username} onChange={handleEditChange} required />
              <TextField label={t("email")} name="email" value={editForm.email} onChange={handleEditChange} required type="email" />
              <FormControl>
                <InputLabel>{t("role")}</InputLabel>
                <Select name="role" label={t("role")} value={editForm.role} onChange={handleEditChange}>
                  <MenuItem value="user">{t("user")}</MenuItem>
                  <MenuItem value="admin">{t("admin")}</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>{t("position")}</InputLabel>
                <Select name="position" label={t("position")} value={editForm.position} onChange={handleEditChange}>
                  <MenuItem value="">–</MenuItem>
                  {POSITIONS.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeEdit}>{t("cancel")}</Button>
              <Button type="submit" variant="contained">{t("save")}</Button>
            </DialogActions>
          </Box>
        </Dialog>
      </Box>
    </Fade>
  );
}
