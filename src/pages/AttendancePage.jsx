import { useState, useMemo } from "react";
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
  Fade,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";

const EMPTY_EDIT = { id: null, userId: "", date: "", arrivalTime: "", departureTime: "", note: "" };

function formatDate(s) {
  if (!s) return "–";
  return new Date(s).toLocaleDateString("cs-CZ");
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
  const min = dh * 60 + dm - (ah * 60 + am);
  if (min <= 0) return "–";
  return `${Math.floor(min / 60)}h ${(min % 60).toString().padStart(2, "0")}m`;
}

function getDurationPreview(arrival, departure) {
  if (!arrival || !departure) return null;
  const [ah, am] = arrival.split(":").map(Number);
  const [dh, dm] = departure.split(":").map(Number);
  const diff = dh * 60 + dm - (ah * 60 + am);
  if (diff <= 0) return null;
  return `${Math.floor(diff / 60)}h ${(diff % 60).toString().padStart(2, "0")}m`;
}

export default function AttendancePage({ t, records, users, onCreateRecord, onUpdateRecord, onDeleteRecord }) {
  // Filters
  const [attUserIdFilter, setAttUserIdFilter] = useState("");
  const [attDateFrom, setAttDateFrom] = useState("");
  const [attDateTo, setAttDateTo] = useState("");
  const [period, setPeriod] = useState("all"); // "day" | "week" | "month" | "year" | "all"

  // Compute date bounds for the quick period selector
  const { periodDateFrom, periodDateTo } = useMemo(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const today = fmt(now);
    if (period === "day") return { periodDateFrom: today, periodDateTo: today };
    if (period === "week") {
      const mon = new Date(now);
      mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { periodDateFrom: fmt(mon), periodDateTo: fmt(sun) };
    }
    if (period === "month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { periodDateFrom: fmt(first), periodDateTo: fmt(last) };
    }
    if (period === "year") {
      return {
        periodDateFrom: `${now.getFullYear()}-01-01`,
        periodDateTo: `${now.getFullYear()}-12-31`,
      };
    }
    return { periodDateFrom: "", periodDateTo: "" };
  }, [period]);

  // Performance chart data — only when a user is selected
  const performanceChartData = useMemo(() => {
    if (!attUserIdFilter) return [];
    const byDay = {};
    for (const r of records) {
      if (Number(r.userId) !== Number(attUserIdFilter)) continue;
      const d = r.date ? r.date.slice(0, 10) : null;
      if (!d) continue;
      const effectiveDateFrom = periodDateFrom || attDateFrom;
      const effectiveDateTo = periodDateTo || attDateTo;
      if (effectiveDateFrom && d < effectiveDateFrom) continue;
      if (effectiveDateTo && d > effectiveDateTo) continue;
      if (!r.arrivalTime || !r.departureTime) continue;
      const [ah, am] = r.arrivalTime.split(":").map(Number);
      const [dh, dm] = r.departureTime.split(":").map(Number);
      const min = dh * 60 + dm - (ah * 60 + am);
      byDay[d] = (byDay[d] || 0) + (min > 0 ? min : 0);
    }
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, minutes]) => ({ date: date.slice(5), hours: +(minutes / 60).toFixed(2) }));
  }, [attUserIdFilter, records, periodDateFrom, periodDateTo, attDateFrom, attDateTo]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Add form
  const [addForm, setAddForm] = useState({ userId: "", date: "", arrivalTime: "", departureTime: "", note: "" });

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);

  const filteredRecords = records.filter((r) => {
    if (attUserIdFilter && r.userId !== Number(attUserIdFilter)) return false;
    // Period quick-filter overrides manual date inputs
    const effectiveDateFrom = periodDateFrom || attDateFrom;
    const effectiveDateTo = periodDateTo || attDateTo;
    if (effectiveDateFrom && r.date.slice(0, 10) < effectiveDateFrom) return false;
    if (effectiveDateTo && r.date.slice(0, 10) > effectiveDateTo) return false;
    return true;
  });

  const paginated = filteredRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  function handleChangePage(_, newPage) { setPage(newPage); }
  function handleChangeRowsPerPage(e) { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }

  function getUsername(userId) {
    return users.find((u) => Number(u.id) === Number(userId))?.username ?? t("unknownUser");
  }

  function handleAddChange(e) {
    setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const addTimeError =
    addForm.arrivalTime && addForm.departureTime
      ? (() => {
          const [ah, am] = addForm.arrivalTime.split(":").map(Number);
          const [dh, dm] = addForm.departureTime.split(":").map(Number);
          return dh * 60 + dm <= ah * 60 + am;
        })()
      : false;

  const addDurationPreview = getDurationPreview(addForm.arrivalTime, addForm.departureTime);

  async function handleAddSubmit(e) {
    e.preventDefault();
    if (addTimeError) return;
    const ok = await onCreateRecord({
      userId: Number(addForm.userId),
      date: `${addForm.date}T00:00:00`,
      arrivalTime: `${addForm.arrivalTime}:00`,
      departureTime: `${addForm.departureTime}:00`,
      note: addForm.note,
    });
    if (ok) setAddForm({ userId: "", date: "", arrivalTime: "", departureTime: "", note: "" });
  }

  function openEdit(record) {
    setEditForm({
      id: record.id,
      userId: record.userId,
      date: toDateInput(record.date),
      arrivalTime: toTimeInput(record.arrivalTime),
      departureTime: toTimeInput(record.departureTime),
      note: record.note || "",
    });
    setEditOpen(true);
  }
  function closeEdit() { setEditOpen(false); setEditForm(EMPTY_EDIT); }
  function handleEditChange(e) { setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); }
  async function handleEditSubmit(e) {
    e.preventDefault();
    await onUpdateRecord(editForm.id, {
      userId: Number(editForm.userId),
      date: `${editForm.date}T00:00:00`,
      arrivalTime: `${editForm.arrivalTime}:00`,
      departureTime: `${editForm.departureTime}:00`,
      note: editForm.note,
    });
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
          {t("attendanceTitle")}
        </Typography>

        {/* Time period selector */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {t("periodLabel")}:
          </Typography>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, val) => val && setPeriod(val)}
            size="small"
          >
            {[
              { val: "day", label: t("periodDay") },
              { val: "week", label: t("periodWeek") },
              { val: "month", label: t("periodMonth") },
              { val: "year", label: t("periodYear") },
              { val: "all", label: t("periodAll") },
            ].map(({ val, label }) => (
              <ToggleButton key={val} value={val} sx={{ px: 2, fontWeight: 600, fontSize: "0.82rem" }}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Per-user performance chart */}
        {attUserIdFilter && performanceChartData.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              {t("userPerformance")} — {users.find((u) => Number(u.id) === Number(attUserIdFilter))?.username}
            </Typography>
            <Box sx={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={performanceChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="h" />
                  <RTooltip formatter={(v) => [`${v}h`, t("dailyHours")]} />
                  <Bar dataKey="hours" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        )}

        {/* Filters */}
        <Paper elevation={2} sx={{ p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t("users")}</InputLabel>
            <Select value={attUserIdFilter} label={t("users")} onChange={(e) => { setAttUserIdFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">{t("allUsers")}</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t("dateFrom")}
            type="date"
            value={attDateFrom}
            onChange={(e) => { setAttDateFrom(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 155 }}
          />
          <TextField
            label={t("dateTo")}
            type="date"
            value={attDateTo}
            onChange={(e) => { setAttDateTo(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 155 }}
          />
        </Paper>

        {/* Table */}
        <Paper elevation={3} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("date")}</TableCell>
                <TableCell>{t("users")}</TableCell>
                <TableCell>{t("arrival")}</TableCell>
                <TableCell>{t("departure")}</TableCell>
                <TableCell>{t("worked")}</TableCell>
                <TableCell>{t("note")}</TableCell>
                <TableCell align="right">{t("actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((r, i) => (
                <TableRow key={r.id} sx={{ bgcolor: i % 2 === 1 ? "action.hover" : "transparent", height: 56 }}>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell>{getUsername(r.userId)}</TableCell>
                  <TableCell>{toTimeInput(r.arrivalTime)}</TableCell>
                  <TableCell>{toTimeInput(r.departureTime)}</TableCell>
                  <TableCell>{calcDuration(r.arrivalTime, r.departureTime)}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {r.note || "–"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" size="small" onClick={() => openEdit(r)}><EditIcon /></IconButton>
                    <IconButton color="error" size="small" onClick={() => onDeleteRecord(r.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 6, textAlign: "center", border: 0 }}>
                    <EventBusyIcon sx={{ fontSize: 56, color: "text.disabled", display: "block", mx: "auto", mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={500}>{t("noRecords")}</Typography>
                    <Typography variant="body2" color="text.disabled">{t("noRecordsHint")}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredRecords.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage={t("rowsPerPage")}
          />
        </Paper>

        {/* Add record form */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>{t("addRecord")}</Typography>
          <Box component="form" onSubmit={handleAddSubmit} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl required size="small" sx={{ minWidth: 170 }}>
              <InputLabel>{t("users")}</InputLabel>
              <Select name="userId" label={t("users")} value={addForm.userId} onChange={handleAddChange}>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label={t("date")} name="date" type="date" value={addForm.date} onChange={handleAddChange} required InputLabelProps={{ shrink: true }} size="small" sx={{ minWidth: 150 }} />
            <TextField label={t("arrival")} name="arrivalTime" type="time" value={addForm.arrivalTime} onChange={handleAddChange} required InputLabelProps={{ shrink: true }} size="small" sx={{ minWidth: 130 }} />
            <TextField
              label={t("departure")}
              name="departureTime"
              type="time"
              value={addForm.departureTime}
              onChange={handleAddChange}
              required
              error={addTimeError}
              helperText={
                addTimeError
                  ? t("departureMustBeAfter")
                  : addDurationPreview
                  ? `${t("workedLabel")}: ${addDurationPreview}`
                  : " "
              }
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 130 }}
            />
            <TextField label={t("note")} name="note" value={addForm.note} onChange={handleAddChange} size="small" sx={{ flex: "1 1 180px" }} />
            <Button variant="contained" type="submit" sx={{ height: 40 }} disabled={addTimeError}>{t("add")}</Button>
          </Box>
        </Paper>

        {/* Edit dialog */}
        <Dialog open={editOpen} onClose={closeEdit}>
          <DialogTitle>{t("editRecord")}</DialogTitle>
          <Box component="form" onSubmit={handleEditSubmit}>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 360 }}>
              <FormControl required>
                <InputLabel>{t("users")}</InputLabel>
                <Select name="userId" label={t("users")} value={editForm.userId} onChange={handleEditChange}>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label={t("date")} name="date" type="date" value={editForm.date} onChange={handleEditChange} required InputLabelProps={{ shrink: true }} />
              <TextField label={t("arrival")} name="arrivalTime" type="time" value={editForm.arrivalTime} onChange={handleEditChange} required InputLabelProps={{ shrink: true }} />
              <TextField label={t("departure")} name="departureTime" type="time" value={editForm.departureTime} onChange={handleEditChange} required InputLabelProps={{ shrink: true }} />
              <TextField label={t("note")} name="note" value={editForm.note} onChange={handleEditChange} multiline rows={2} />
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
