import { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";

// â”€â”€â”€ CSV helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function toCSV(rows, headers) {
  const escape = (val) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };
  const headerLine = headers.map(({ label }) => escape(label)).join(",");
  const dataLines = rows.map((row) =>
    headers
      .map(({ key, transform }) => escape(transform ? transform(row[key], row) : row[key]))
      .join(",")
  );
  return [headerLine, ...dataLines].join("\r\n");
}

function downloadCSV(content, filename) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toTimeStr(t) {
  return t ? t.slice(0, 5) : "";
}

function toDateStr(d) {
  return d ? new Date(d).toLocaleDateString("cs-CZ") : "";
}

function calcDuration(arrival, departure) {
  if (!arrival || !departure) return "";
  const [ah, am] = arrival.split(":").map(Number);
  const [dh, dm] = departure.split(":").map(Number);
  const min = dh * 60 + dm - (ah * 60 + am);
  if (min <= 0) return "";
  return `${Math.floor(min / 60)}h ${(min % 60).toString().padStart(2, "0")}m`;
}

// â”€â”€â”€ Preview table component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PreviewTable({ rows, headers, t }) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
        {t("noExportData")}
      </Typography>
    );
  }
  const preview = rows.slice(0, 5);
  return (
    <Box sx={{ overflowX: "auto", mt: 1.5 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((h) => (
              <TableCell key={h.label} sx={{ fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.78rem" }}>
                {h.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {preview.map((row, i) => (
            <TableRow key={i} sx={{ bgcolor: i % 2 === 1 ? "action.hover" : "transparent" }}>
              {headers.map((h) => (
                <TableCell key={h.label} sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                  {h.transform ? h.transform(row[h.key], row) : (row[h.key] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > 5 && (
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5, pl: 0.5 }}>
          + {rows.length - 5} more rows
        </Typography>
      )}
    </Box>
  );
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ExportPage({ t, users, records, positions }) {
  // Attendance export filters
  const [attUserFilter, setAttUserFilter] = useState("");
  const [attDateFrom, setAttDateFrom] = useState("");
  const [attDateTo, setAttDateTo] = useState("");

  const userMap = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u.username])),
    [users]
  );

  // â”€â”€ User export headers
  const userHeaders = [
    { key: "id", label: "ID" },
    { key: "username", label: t("name") },
    { key: "email", label: t("email") },
    { key: "role", label: t("role") },
    { key: "id", label: t("position"), transform: (val) => positions[val] ?? "" },
  ];

  // â”€â”€ Attendance export headers
  const attHeaders = [
    { key: "id", label: "ID" },
    { key: "userId", label: t("users"), transform: (val) => userMap[val] ?? String(val) },
    { key: "date", label: t("date"), transform: (val) => toDateStr(val) },
    { key: "arrivalTime", label: t("arrival"), transform: (val) => toTimeStr(val) },
    { key: "departureTime", label: t("departure"), transform: (val) => toTimeStr(val) },
    {
      key: "arrivalTime",
      label: t("worked"),
      transform: (_, row) => calcDuration(row.arrivalTime, row.departureTime),
    },
    { key: "note", label: t("note") },
  ];

  // â”€â”€ Filtered attendance records for export
  const filteredRecords = useMemo(
    () =>
      records.filter((r) => {
        if (attUserFilter && r.userId !== Number(attUserFilter)) return false;
        if (attDateFrom && r.date.slice(0, 10) < attDateFrom) return false;
        if (attDateTo && r.date.slice(0, 10) > attDateTo) return false;
        return true;
      }),
    [records, attUserFilter, attDateFrom, attDateTo]
  );

  function handleExportUsers() {
    downloadCSV(toCSV(users, userHeaders), "users.csv");
  }

  function handleExportAttendance() {
    downloadCSV(toCSV(filteredRecords, attHeaders), "attendance.csv");
  }

  const SECTION_CARD = {
    p: 3,
    mb: 3,
    transition: "box-shadow 0.2s",
    "&:hover": { boxShadow: 6 },
  };

  return (
    <Fade in timeout={400}>
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
          gutterBottom
          sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 2, mb: 3 }}
        >
          {t("exportTitle")}
        </Typography>

        {/* â”€â”€ Users Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Paper elevation={3} sx={SECTION_CARD}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <PeopleIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>
              {t("exportUsersSection")}
            </Typography>
            <Chip label={`${users.length} ${t("users").toLowerCase()}`} size="small" sx={{ ml: "auto" }} />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("previewFirst5")}
          </Typography>

          <PreviewTable rows={users} headers={userHeaders} t={t} />

          <Divider sx={{ my: 2 }} />

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportUsers}
            disabled={users.length === 0}
          >
            {t("download")}
          </Button>
        </Paper>

        {/* â”€â”€ Attendance Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Paper elevation={3} sx={SECTION_CARD}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <EventNoteIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>
              {t("exportAttendanceSection")}
            </Typography>
            <Chip
              label={`${filteredRecords.length} / ${records.length}`}
              size="small"
              color={filteredRecords.length < records.length ? "warning" : "default"}
              sx={{ ml: "auto" }}
            />
          </Box>

          {/* Filters */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{t("users")}</InputLabel>
              <Select
                value={attUserFilter}
                label={t("users")}
                onChange={(e) => setAttUserFilter(e.target.value)}
              >
                <MenuItem value="">{t("allUsers")}</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t("dateFrom")}
              type="date"
              value={attDateFrom}
              onChange={(e) => setAttDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 155 }}
            />
            <TextField
              label={t("dateTo")}
              type="date"
              value={attDateTo}
              onChange={(e) => setAttDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 155 }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t("previewFirst5")}
          </Typography>

          <PreviewTable rows={filteredRecords} headers={attHeaders} t={t} />

          <Divider sx={{ my: 2 }} />

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportAttendance}
            disabled={filteredRecords.length === 0}
          >
            {t("download")}
          </Button>
        </Paper>
      </Box>
    </Fade>
  );
}
