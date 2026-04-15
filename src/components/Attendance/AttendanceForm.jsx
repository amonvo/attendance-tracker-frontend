import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const INITIAL_FORM = {
  userId: "",
  date: "",
  arrivalTime: "",
  departureTime: "",
  note: "",
};

function getDurationPreview(arrival, departure) {
  if (!arrival || !departure) return null;
  const [ah, am] = arrival.split(":").map(Number);
  const [dh, dm] = departure.split(":").map(Number);
  const diff = dh * 60 + dm - (ah * 60 + am);
  if (diff <= 0) return null;
  return `${Math.floor(diff / 60)}h ${(diff % 60).toString().padStart(2, "0")}m`;
}

export default function AttendanceForm({ users, onSubmit }) {
  const [form, setForm] = useState(INITIAL_FORM);

  function handleFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const timeError =
    form.arrivalTime && form.departureTime
      ? (() => {
          const [ah, am] = form.arrivalTime.split(":").map(Number);
          const [dh, dm] = form.departureTime.split(":").map(Number);
          return dh * 60 + dm <= ah * 60 + am;
        })()
      : false;

  const durationPreview = getDurationPreview(form.arrivalTime, form.departureTime);

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (timeError) return;
    const success = await onSubmit({
      userId: Number(form.userId),
      date: `${form.date}T00:00:00`,
      arrivalTime: `${form.arrivalTime}:00`,
      departureTime: `${form.departureTime}:00`,
      note: form.note,
    });
    if (success) setForm(INITIAL_FORM);
  }

  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Přidat záznam docházky
      </Typography>
      <Box
        component="form"
        onSubmit={handleFormSubmit}
        sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}
      >
        <FormControl required sx={{ minWidth: 180 }}>
          <InputLabel id="att-form-user-label">Uživatel</InputLabel>
          <Select
            labelId="att-form-user-label"
            name="userId"
            label="Uživatel"
            value={form.userId}
            onChange={handleFormChange}
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
          value={form.date}
          onChange={handleFormChange}
          required
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          label="Příchod"
          name="arrivalTime"
          type="time"
          value={form.arrivalTime}
          onChange={handleFormChange}
          required
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
        />
        <TextField
          label="Odchod"
          name="departureTime"
          type="time"
          value={form.departureTime}
          onChange={handleFormChange}
          required
          error={timeError}
          helperText={
            timeError
              ? "Odchod musí být po příchodu"
              : durationPreview
              ? `Odpracováno: ${durationPreview}`
              : " "
          }
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
        />
        <TextField
          label="Poznámka"
          name="note"
          value={form.note}
          onChange={handleFormChange}
          sx={{ flex: "1 1 200px" }}
        />
        <Button
          variant="contained"
          type="submit"
          sx={{ height: 56 }}
          disabled={timeError}
        >
          Přidat
        </Button>
      </Box>
    </Paper>
  );
}
