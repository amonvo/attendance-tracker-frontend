import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from "@mui/material";

export default function AttendanceFilter({
  users,
  userIdFilter,
  onUserIdFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}) {
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
        flexWrap: "wrap",
        maxWidth: 800,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}
    >
      <FormControl sx={{ minWidth: 180 }}>
        <InputLabel id="att-filter-user-label">Uživatel</InputLabel>
        <Select
          labelId="att-filter-user-label"
          value={userIdFilter}
          label="Uživatel"
          onChange={(e) => onUserIdFilterChange(e.target.value)}
        >
          <MenuItem value="">Všichni</MenuItem>
          {users.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.username}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Datum od"
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 160 }}
      />
      <TextField
        label="Datum do"
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 160 }}
      />
    </Paper>
  );
}
