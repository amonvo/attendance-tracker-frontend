import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from "@mui/material";

export default function UserFilter({ search, onSearchChange, roleFilter, onRoleFilterChange }) {
  return (
    <Paper
      elevation={5}
      sx={{
        display: "flex",
        gap: 2,
        mb: 4,
        px: 3,
        py: 2,
        alignItems: "center",
        borderRadius: 4,
        maxWidth: 650,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}
    >
      <TextField
        label="Hledat uživatele"
        variant="outlined"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ borderRadius: 1 }}
      />
      <FormControl sx={{ minWidth: 140, borderRadius: 1 }}>
        <InputLabel id="role-filter-label">Role</InputLabel>
        <Select
          labelId="role-filter-label"
          value={roleFilter}
          label="Role"
          onChange={(e) => onRoleFilterChange(e.target.value)}
        >
          <MenuItem value="">Všechny</MenuItem>
          <MenuItem value="user">User</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </Select>
      </FormControl>
    </Paper>
  );
}
