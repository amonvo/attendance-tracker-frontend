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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EventBusyIcon from "@mui/icons-material/EventBusy";

const EMPTY_EDIT_FORM = {
  id: null,
  userId: "",
  date: "",
  arrivalTime: "",
  departureTime: "",
  note: "",
};

function formatDate(dateStr) {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("cs-CZ");
}

function toTimeInput(t) {
  if (!t) return "";
  return t.slice(0, 5);
}

function toDateInput(d) {
  if (!d) return "";
  return d.slice(0, 10);
}

function calcDuration(arrival, departure) {
  if (!arrival || !departure) return "–";
  const [ah, am] = arrival.split(":").map(Number);
  const [dh, dm] = departure.split(":").map(Number);
  const totalMin = dh * 60 + dm - (ah * 60 + am);
  if (totalMin <= 0) return "–";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export default function AttendanceTable({ records, users, onDelete, onUpdate }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  function openEditDialog(record) {
    setEditForm({
      id: record.id,
      userId: record.userId,
      date: toDateInput(record.date),
      arrivalTime: toTimeInput(record.arrivalTime),
      departureTime: toTimeInput(record.departureTime),
      note: record.note || "",
    });
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
    await onUpdate(editForm.id, {
      userId: Number(editForm.userId),
      date: `${editForm.date}T00:00:00`,
      arrivalTime: `${editForm.arrivalTime}:00`,
      departureTime: `${editForm.departureTime}:00`,
      note: editForm.note,
    });
    closeEditDialog();
  }

  function getUsername(userId) {
    return users.find((u) => Number(u.id) === Number(userId))?.username ?? "Neznámý uživatel";
  }

  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Záznamy docházky
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Datum</TableCell>
            <TableCell>Uživatel</TableCell>
            <TableCell>Příchod</TableCell>
            <TableCell>Odchod</TableCell>
            <TableCell>Odpracováno</TableCell>
            <TableCell>Poznámka</TableCell>
            <TableCell align="right">Akce</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((r, index) => (
            <TableRow
              key={r.id}
              sx={{ height: 56, bgcolor: index % 2 === 1 ? "action.hover" : "transparent" }}
            >
              <TableCell>{formatDate(r.date)}</TableCell>
              <TableCell>{getUsername(r.userId)}</TableCell>
              <TableCell>{toTimeInput(r.arrivalTime)}</TableCell>
              <TableCell>{toTimeInput(r.departureTime)}</TableCell>
              <TableCell>{calcDuration(r.arrivalTime, r.departureTime)}</TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {r.note || "–"}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton color="primary" onClick={() => openEditDialog(r)}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => onDelete(r.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {records.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} sx={{ py: 6, textAlign: "center", border: 0 }}>
                <EventBusyIcon sx={{ fontSize: 56, color: "text.disabled", display: "block", mx: "auto", mb: 1 }} />
                <Typography color="text.secondary" fontWeight={500}>Žádné záznamy docházky</Typography>
                <Typography variant="body2" color="text.disabled">
                  Přidejte první záznam pomocí formuláře níže.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={editDialogOpen} onClose={closeEditDialog}>
        <DialogTitle>Editace záznamu</DialogTitle>
        <Box component="form" onSubmit={handleEditFormSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 350 }}>
            <FormControl required>
              <InputLabel id="edit-att-user-label">Uživatel</InputLabel>
              <Select
                labelId="edit-att-user-label"
                name="userId"
                label="Uživatel"
                value={editForm.userId}
                onChange={handleEditFormChange}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Datum"
              name="date"
              type="date"
              value={editForm.date}
              onChange={handleEditFormChange}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Příchod"
              name="arrivalTime"
              type="time"
              value={editForm.arrivalTime}
              onChange={handleEditFormChange}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Odchod"
              name="departureTime"
              type="time"
              value={editForm.departureTime}
              onChange={handleEditFormChange}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Poznámka"
              name="note"
              value={editForm.note}
              onChange={handleEditFormChange}
              multiline
              rows={2}
            />
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
