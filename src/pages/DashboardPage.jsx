import { useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Fade,
  Divider,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import TodayIcon from "@mui/icons-material/Today";
import TimerIcon from "@mui/icons-material/Timer";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";
import CountUp from "react-countup";

const ROLE_COLORS = { admin: "#1976d2", user: "#42a5f5" };
const CARD_SX = {
  p: 3,
  height: "100%",
  transition: "box-shadow 0.25s",
  "&:hover": { boxShadow: 8 },
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
};

function toMinutes(arrival, departure) {
  if (!arrival || !departure) return 0;
  const [ah, am] = arrival.split(":").map(Number);
  const [dh, dm] = departure.split(":").map(Number);
  const diff = dh * 60 + dm - (ah * 60 + am);
  return diff > 0 ? diff : 0;
}

function recordDate(r) {
  return r.date ? r.date.slice(0, 10) : null;
}

function formatHours(minutes) {
  if (minutes === 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m.toString().padStart(2, "0")}m`;
}

export default function DashboardPage({ t, records, users }) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  // 1. Active today
  const activeToday = useMemo(
    () => new Set(records.filter((r) => recordDate(r) === today).map((r) => r.userId)).size,
    [records, today]
  );

  // 2. This month minutes
  const thisMonthRecords = useMemo(
    () =>
      records.filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
      }),
    [records, thisYear, thisMonth]
  );

  // 3. Avg daily hours this month — total minutes / unique days
  const avgDailyHours = useMemo(() => {
    if (!thisMonthRecords.length) return 0;
    const byDay = {};
    for (const r of thisMonthRecords) {
      const d = recordDate(r);
      if (!d) continue;
      byDay[d] = (byDay[d] || 0) + toMinutes(r.arrivalTime, r.departureTime);
    }
    const days = Object.keys(byDay).length;
    if (!days) return 0;
    const totalMin = Object.values(byDay).reduce((a, b) => a + b, 0);
    return Math.round(totalMin / days);
  }, [thisMonthRecords]);

  // 4. Avg weekly hours this month
  const avgWeeklyHours = useMemo(() => {
    if (!thisMonthRecords.length) return 0;
    const byWeek = {};
    for (const r of thisMonthRecords) {
      const d = new Date(r.date);
      // ISO week key: year + week number
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-${week}`;
      byWeek[key] = (byWeek[key] || 0) + toMinutes(r.arrivalTime, r.departureTime);
    }
    const weeks = Object.keys(byWeek).length;
    if (!weeks) return 0;
    const total = Object.values(byWeek).reduce((a, b) => a + b, 0);
    return Math.round(total / weeks);
  }, [thisMonthRecords]);

  // 5. Total hours this year
  const totalYearMinutes = useMemo(
    () =>
      records
        .filter((r) => r.date && new Date(r.date).getFullYear() === thisYear)
        .reduce((acc, r) => acc + toMinutes(r.arrivalTime, r.departureTime), 0),
    [records, thisYear]
  );

  // 6. Bar chart: this week Mon-Sun (timezone-safe string comparison)
  const weekBarData = useMemo(() => {
    const CZ_SHORT = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
    const result = CZ_SHORT.map((name) => ({ name, minutes: 0, hours: 0 }));
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // 0=Mon
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - dayOfWeek + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    });
    for (const r of records) {
      const dateStr = recordDate(r);
      if (!dateStr) continue;
      const idx = weekDates.indexOf(dateStr);
      if (idx >= 0) {
        result[idx].minutes += toMinutes(r.arrivalTime, r.departureTime);
      }
    }
    return result.map((d) => ({ ...d, hours: +(d.minutes / 60).toFixed(2) }));
  }, [records]);

  // 7. Pie chart: role distribution
  const pieData = useMemo(() => {
    const counts = {};
    for (const u of users) {
      counts[u.role] = (counts[u.role] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);

  // 8. Line chart: last 30 days total hours/day
  const lineData = useMemo(() => {
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key.slice(5), fullDate: key, minutes: 0 });
    }
    for (const r of records) {
      const key = recordDate(r);
      if (!key) continue;
      const item = result.find((x) => x.fullDate === key);
      if (item) item.minutes += toMinutes(r.arrivalTime, r.departureTime);
    }
    return result.map((d) => ({ ...d, hours: +(d.minutes / 60).toFixed(2) }));
  }, [records]);

  const statCards = [
    {
      label: t("totalUsers"),
      value: users.length,
      icon: <PeopleIcon sx={{ fontSize: 32, color: "primary.main" }} />,
      isCount: true,
    },
    {
      label: t("activeToday"),
      value: activeToday,
      icon: <TodayIcon sx={{ fontSize: 32, color: "success.main" }} />,
      isCount: true,
    },
    {
      label: t("avgDailyHours"),
      value: formatHours(avgDailyHours),
      icon: <TimerIcon sx={{ fontSize: 32, color: "warning.main" }} />,
      isCount: false,
    },
    {
      label: t("avgWeeklyHours"),
      value: formatHours(avgWeeklyHours),
      icon: <CalendarMonthIcon sx={{ fontSize: 32, color: "info.main" }} />,
      isCount: false,
    },
    {
      label: t("totalHoursYear"),
      value: formatHours(totalYearMinutes),
      icon: <TrendingUpIcon sx={{ fontSize: 32, color: "secondary.main" }} />,
      isCount: false,
    },
  ];

  return (
    <Fade in timeout={600}>
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
          gutterBottom
          sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 2, mb: 3 }}
        >
          {t("dashboard")}
        </Typography>

        {/* Stat cards */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {statCards.map((card) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={card.label}>
              <Paper elevation={3} sx={{ ...CARD_SX, minHeight: 120, borderLeft: "3px solid", borderColor: "primary.main" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {card.label}
                  </Typography>
                  {card.icon}
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {card.isCount ? (
                    <CountUp end={card.value} duration={1.2} />
                  ) : (
                    card.value
                  )}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Charts: Bar md=5 | Pie md=3 | Line md=4 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Bar chart */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={3} sx={{ ...CARD_SX, p: 2, minHeight: 380, width: "100%" }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t("attendanceThisWeek")}
              </Typography>
              <Box sx={{ width: "100%" }}>
                <ResponsiveContainer width="99%" height={300}>
                  <BarChart data={weekBarData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="h" />
                    <RTooltip formatter={(val) => [`${val}h`, "Odpracováno"]} />
                    <Bar dataKey="hours" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Pie chart */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper elevation={3} sx={{ ...CARD_SX, p: 2, minHeight: 380, width: "100%" }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t("roleDistribution")}
              </Typography>
              <Box sx={{ width: "100%" }}>
                {users.length === 0 ? (
                  <Box sx={{ display: "flex", alignItems: "center", height: 300 }}>
                    <Typography color="text.disabled">No data</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="99%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || "#90caf9"} />
                        ))}
                      </Pie>
                      <RTooltip formatter={(val, name) => [val, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Line chart */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={3} sx={{ ...CARD_SX, p: 2, minHeight: 380, width: "100%" }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {t("hoursTrend")}
              </Typography>
              <Box sx={{ width: "100%" }}>
                <ResponsiveContainer width="99%" height={300}>
                  <LineChart data={lineData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 12 }} unit="h" />
                    <RTooltip formatter={(val) => [`${val}h`, "Odpracováno"]} />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#1976d2"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
}
