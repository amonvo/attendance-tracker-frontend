import { Box, Paper, Typography, Grid, Fade } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import CountUp from "react-countup";

const CHART_COLORS = ["#1976d2", "#b0bec5"];

const CARD_SX = {
  height: "100%",
  transition: "box-shadow 0.25s",
  "&:hover": { boxShadow: 8 },
};

function calcMonthlyMinutes(records) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = now.getMonth();
  let totalMin = 0;
  for (const r of records) {
    if (!r.date || !r.arrivalTime || !r.departureTime) continue;
    const d = new Date(r.date);
    if (d.getFullYear() !== yyyy || d.getMonth() !== mm) continue;
    const parts = (t) => t.split(":").map(Number);
    const [ah, am] = parts(r.arrivalTime);
    const [dh, dm] = parts(r.departureTime);
    const diff = dh * 60 + dm - (ah * 60 + am);
    if (diff > 0) totalMin += diff;
  }
  return totalMin;
}

export default function Dashboard({ users, records = [] }) {
  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;
  const totalCount = users.length;

  const pieData = [
    { name: "Admin", value: adminCount },
    { name: "User", value: userCount },
  ];

  const sortedUsers = [...users].sort((a, b) => b.id - a.id);
  const newestUsers = sortedUsers.slice(0, 3);
  const lastUser = sortedUsers[0];

  const monthlyMin = calcMonthlyMinutes(records);
  const monthlyH = Math.floor(monthlyMin / 60);
  const monthlyM = monthlyMin % 60;

  return (
    <Fade in timeout={600}>
      <Box>
        <Grid container spacing={3} sx={{ mb: 4 }} alignItems="stretch">
          {/* Total user count */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={4} sx={{ textAlign: "center", py: 2.5, ...CARD_SX }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
                Celkový počet uživatelů
              </Typography>
              <Typography variant="h3" sx={{ mt: 1, mb: 0 }}>
                <CountUp end={totalCount} duration={1.2} />
              </Typography>
            </Paper>
          </Grid>

          {/* Monthly hours */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={4} sx={{ textAlign: "center", py: 2.5, ...CARD_SX }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
                Odpracováno tento měsíc
              </Typography>
              <Typography variant="h3" sx={{ mt: 1, mb: 0 }}>
                {monthlyMin === 0
                  ? "0h"
                  : `${monthlyH}h ${monthlyM.toString().padStart(2, "0")}m`}
              </Typography>
            </Paper>
          </Grid>

          {/* Pie chart: Admin vs User */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={4} sx={{ textAlign: "center", py: 2.5, ...CARD_SX }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.7, mb: 2 }}>
                Admini vs. Uživatelé
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  height: 140,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {totalCount === 0 ? (
                  <Typography sx={{ opacity: 0.5 }}>Žádná data</Typography>
                ) : (
                  <ResponsiveContainer width="90%" height={120}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={48}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={entry.name} fill={CHART_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Newest users */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={4} sx={{ py: 2.5, px: 2, ...CARD_SX }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
                Nejnovější uživatelé
              </Typography>
              <Box sx={{ mt: 1 }}>
                {newestUsers.length === 0 && (
                  <Typography fontSize="1.1em">Žádní uživatelé</Typography>
                )}
                {newestUsers.map((u) => (
                  <Box key={u.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <Avatar
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=random&color=fff`}
                      sx={{ width: 32, height: 32, fontWeight: "bold", flexShrink: 0 }}
                    >
                      {u.username[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ overflow: "hidden" }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: "0.95em",
                        }}
                      >
                        {u.username}
                      </Typography>
                      <Chip
                        label={u.role}
                        size="small"
                        sx={{
                          bgcolor: u.role === "admin" ? "primary.main" : "action.selected",
                          color: u.role === "admin" ? "primary.contrastText" : "text.primary",
                          fontWeight: 600,
                          fontSize: "0.75em",
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Last registration */}
        <Paper elevation={4} sx={{ mb: 3, p: 2, ...CARD_SX }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
            Poslední registrace
          </Typography>
          {lastUser ? (
            <Typography sx={{ fontWeight: 600, mt: 0.8 }}>
              {lastUser.username} ({lastUser.email}) –{" "}
              <Typography component="span" color="primary.light" sx={{ fontWeight: 600 }}>
                ID: {lastUser.id}
              </Typography>
            </Typography>
          ) : (
            <Typography sx={{ mt: 0.8 }}>Zatím žádná registrace.</Typography>
          )}
        </Paper>
      </Box>
    </Fade>
  );
}
