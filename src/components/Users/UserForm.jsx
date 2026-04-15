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

const INITIAL_FORM = { username: "", email: "", password: "", role: "user" };

export default function UserForm({ onSubmit }) {
  const [form, setForm] = useState(INITIAL_FORM);

  function handleFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const success = await onSubmit(form);
    if (success) {
      setForm(INITIAL_FORM);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Přidat uživatele
      </Typography>
      <Box
        component="form"
        onSubmit={handleFormSubmit}
        sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}
      >
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
  );
}
