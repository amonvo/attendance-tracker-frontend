import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";
import DownloadIcon from "@mui/icons-material/Download";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

const NAV_ITEMS = [
  { id: "dashboard", icon: <DashboardIcon /> },
  { id: "users", icon: <PeopleIcon /> },
  { id: "attendance", icon: <EventNoteIcon /> },
  { id: "export", icon: <DownloadIcon /> },
];

export default function Sidebar({ activePage, onNavigate, darkMode, onToggleDark, lang, onToggleLang, t }) {
  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography variant="h6" fontWeight={800} color="primary" letterSpacing={0.5}>
          AttendanceTracker
        </Typography>
        <Typography variant="caption" color="text.secondary">
          HR Management
        </Typography>
      </Box>

      <Divider />

      {/* Nav items */}
      <List sx={{ flex: 1, pt: 1 }}>
        {NAV_ITEMS.map(({ id, icon }) => {
          const active = activePage === id;
          return (
            <ListItemButton
              key={id}
              selected={active}
              onClick={() => onNavigate(id)}
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                  "&:hover": { bgcolor: "primary.dark" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: active ? "primary.contrastText" : "text.secondary" }}>
                {icon}
              </ListItemIcon>
              <ListItemText
                primary={t(id)}
                primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: "0.95rem" }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      {/* Footer controls */}
      <Box sx={{ px: 2, py: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Dark/light toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Brightness7Icon sx={{ fontSize: 18, opacity: darkMode ? 0.4 : 1, color: "text.secondary" }} />
          <Switch
            checked={darkMode}
            onChange={onToggleDark}
            size="small"
            color="primary"
            inputProps={{ "aria-label": "dark mode toggle" }}
          />
          <Brightness4Icon sx={{ fontSize: 18, opacity: darkMode ? 1 : 0.4, color: "text.secondary" }} />
        </Box>

        {/* Language toggle */}
        <ToggleButtonGroup
          value={lang}
          exclusive
          onChange={(_, val) => val && onToggleLang(val)}
          size="small"
          sx={{ alignSelf: "flex-start" }}
        >
          <ToggleButton value="cs" sx={{ px: 1.5, py: 0.5, fontWeight: 700, fontSize: "0.8rem" }}>
            CS
          </ToggleButton>
          <ToggleButton value="en" sx={{ px: 1.5, py: 0.5, fontWeight: 700, fontSize: "0.8rem" }}>
            EN
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}
