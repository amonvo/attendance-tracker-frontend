import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
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
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonOffIcon from "@mui/icons-material/PersonOff";

const EMPTY_EDIT_FORM = { id: null, username: "", email: "", role: "user" };

export default function UserTable({ users, onDelete, onUpdate }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  function openEditDialog(user) {
    setEditForm({ ...user });
    setEditDialogOpen(true);
  }

  function closeEditDialog() {
    setEditDialogOpen(false);
    setEditForm(EMPTY_EDIT_FORM);
  }

  function handleEditFormChange(e) {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleEditFormSubmit(e) {
    e.preventDefault();
    await onUpdate(editForm.id, { ...editForm, passwordHash: "" });
    closeEditDialog();
  }

  return (
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
          {users.map((u, index) => (
            <TableRow key={u.id} sx={{ height: 64, bgcolor: index % 2 === 1 ? "action.hover" : "transparent" }}>
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
                        bgcolor: u.role === "admin" ? "primary.main" : "action.selected",
                        color: u.role === "admin" ? "primary.contrastText" : "text.primary",
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
                <Typography variant="body2" color="text.secondary">
                  {u.email}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton color="primary" onClick={() => openEditDialog(u)}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => onDelete(u.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} sx={{ py: 6, textAlign: "center", border: 0 }}>
                <PersonOffIcon sx={{ fontSize: 56, color: "text.disabled", display: "block", mx: "auto", mb: 1 }} />
                <Typography color="text.secondary" fontWeight={500}>Žádní uživatelé</Typography>
                <Typography variant="body2" color="text.disabled">
                  Přidejte prvního uživatele pomocí formuláře níže.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
            <Button type="submit" variant="contained">
              Uložit
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Paper>
  );
}
